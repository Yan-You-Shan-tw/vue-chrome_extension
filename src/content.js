const delay = (time) => {
    return new Promise((resolve) => {
        window.setTimeout(resolve, time);
        //console.log('wait', time);
    });
}

function getProfile() {
    let ID = document.querySelector('.profilePicThumb') == null ?
        'not found' : document.querySelector('.profilePicThumb').href.split('=').slice(-1).join('');
    let name = document.querySelector('.profilePicThumb>img') == null ?
        'not found' : document.querySelector('.profilePicThumb>img').alt.split("'s Profile Photo")[0];
    let img = document.querySelector('.profilePicThumb>img') == null ?
        'not found' : document.querySelector('.profilePicThumb>img').src;
    let return_item = { ID, name, img };
    //console.log(return_item);
    return return_item;
}

async function getComment() {
    let comment_arr = [];
    let comments = document.querySelector('.fbPhotosSnowliftFeedback').nextElementSibling.querySelector('h6').parentNode.querySelectorAll('.clearfix');
    
    let index = 1;
    for(let i=0; i < comments.length; i++) {
        if((comments[i].querySelector('.livetimestamp')) !== null) {
            var comment_span = comments[i].querySelectorAll('div')[3].querySelectorAll('span').length;
            if(comments[i].querySelectorAll('div')[3].querySelector('span').innerText == '' && comment_span < 3) continue;
            else {
                let content = (comments[i].querySelectorAll('div')[3].querySelector('span').innerText == "") ? comments[i].querySelectorAll('div')[3].querySelectorAll('span')[3].innerText.replace(/(\r\n|\n|\r)/gm, " ").trim() : comments[i].querySelectorAll('div')[3].querySelector('span').innerText.replace(/(\r\n|\n|\r)/gm, " ").trim();
                let name = comments[i].querySelectorAll('div')[3].querySelector('a').innerText;
                var level_text = comments[i].getAttribute('aria-label');
                if (level_text.search(/reply/i) >= 0) var level = 2;
                else var level = 1;
                let comment_link = comments[i].querySelector('.livetimestamp').parentNode.getAttribute('href');
                let reply_index = comment_link.search("&reply_comment_id=");
                if(reply_index >= 0) { 
                    var comment_id = comment_link.split("&reply_comment_id")[0].split("comment_id=")[1];
                    var reply_comment_id = comment_link.slice(reply_index + "&reply_comment_id=".length);
                } else {
                    var comment_index = comment_link.search("comment_id=") + "comment_id=".length;
                    var comment_id = comment_link.slice(comment_index);
                    var reply_comment_id = '';
                }
                let user_id = comments[i].querySelector('.lfloat > a').getAttribute('data-hovercard').split('user.php?id=')[1];
                
                let time_text = comments[i].querySelector('.livetimestamp').getAttribute('data-tooltip-content');
                let month = time_text.split(",")[1].trim();
                let year = time_text.split(",")[2].split("at")[0].trim();
                let time = time_text.split(",")[2].split("at")[1].trim();
                let time_str = ''.concat(month, ' ', year, ' ', time);
                let timestamp = Date.parse(time_str) / 1000;

                if(comments[i].querySelector("[aria-label='See who reacted to this']") == null) var like = 0;
                else {
                    comments[i].scrollIntoView({ block: "center"});
                    let like_time_count = 0;
                    while(true) {
                        let like_text = comments[i].querySelector("[aria-label='See who reacted to this']").innerText;
                        if(like_text !== "" || like_time_count >= 10) break;
                        else {
                            like_time_count++;
                            await delay(1000);
                        } 
                    }
                    var like = comments[i].querySelector("[aria-label='See who reacted to this']").innerText == "" ? 0 : parseInt(comments[i].querySelector("[aria-label='See who reacted to this']").innerText, 10);
                    //console.log(like);
                }
                
                var comment_obj = { id: index,comment_id: comment_id, reply_comment_id: reply_comment_id, user_id: user_id, time: timestamp, name: name, content: content, like: like, level: level };
                //console.log(i, comment_obj);
                comment_arr.push(comment_obj);  
                index++;  
            }
            
        }

    }
    let expand_obj = { ...comment_arr };
    return expand_obj;
}

async function clickComments() {
    while (true) {
        let comment_area = document.querySelector('.fbPhotosSnowliftFeedback').nextElementSibling.querySelector('h6').parentElement;
        let all_span = comment_area.querySelectorAll('span');
        let origin_len = comment_area.querySelectorAll('.clearfix').length;
        let count = 0;
        for (let i = 0; i < all_span.length; i++) {
            if (all_span[i].innerText.search('more comment') >= 0 || all_span[i].innerText.search('replied') >= 0 || all_span[i].innerText.search('more reply') >= 0 || all_span[i].innerText.search('more replies') >= 0) {
                all_span[i].click();
                await delay(1500);
                var check_count = 0;
                while(true) {
                    var last_len = comment_area.querySelectorAll('.clearfix').length;
                    if(origin_len !== last_len || check_count>=10) break;
                    else check_count++;
                }
                count++;
                //console.log('click:', i);
            }
        }
        if (count == 0 || check_count>=10) return;
    }
}

function check_comments() {
    let comment_ele = (document.querySelector('.fbPhotosSnowliftFeedback')==null) ? false: ( (document.querySelector('.fbPhotosSnowliftFeedback').nextElementSibling==null) ? false : document.querySelector('.fbPhotosSnowliftFeedback').nextElementSibling.querySelector('h6') ==null? false: document.querySelector('.fbPhotosSnowliftFeedback').nextElementSibling.querySelector('h6').parentElement ==null? false: true);
    return comment_ele;
}

async function wait_comments() {
    let check_ele = await check_comments();
    if(!check_ele) {
        chrome.storage.local.set({ comment: {state: '', data: '' }}, function() { });
    }else{
        await clickComments();
        let comment_item = await getComment();
        chrome.storage.local.set({ comment: {state: 'finish', data: comment_item }}, function() { });
    }   
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
    //console.log('changes:', changes);
    var storage_keys = Object.keys(changes);
    for(const storage_key of storage_keys) {
        if(storage_key == 'comment') { 
            chrome.storage.local.get('comment', function (data) {
                if(data.comment.state == 'fetch_comment') {
                     wait_comments();
                }
               
            })
        } else if(storage_key == 'profile') { 
            chrome.storage.local.get('profile', function (item) {
                let storage_profile_data = item.profile.data;
                let storage_profile_keys = Object.keys(storage_profile_data);
                for (const key of storage_profile_keys) { 
                    if (!storage_profile_data[key].hasOwnProperty('len') && storage_profile_data[key].state == 'fetch') {
                        let profile_item = getProfile();
                        var current_url = location.href;
                        storage_profile_data[key].data = profile_item;
                        storage_profile_data[key].state = 'finish';
                        console.log('now url:', current_url, ', insert data:', storage_profile_data[key]);
                        chrome.storage.local.set({ profile: { data: storage_profile_data } }, function () { });
                        break;
                    }

                }        
            })

        }
    }
})