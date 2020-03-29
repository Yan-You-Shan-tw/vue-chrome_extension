<template>
  <div id="app" class="container">
    <div class="container">
      <div class="card border-secondary">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <a class="nav-link" :class="{'active': visibility == 'profile'}" @click="visibility = 'profile'" href="#">Profile</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{'active': visibility == 'comment'}" @click="visibility = 'comment'" href="#">Comment</a>
            </li>
          </ul>
        </div>
        <div class="card-body">

          <div v-if="visibility == 'profile'">
            <form>
              <div class="form-group">
                <div>輸入Facebook個人介紹連結(可多個),並以逗號隔開 :</div>
                <textarea  class="form-control" id="inputArea"
                placeholder="facebook.com/profile.ph.?id=example"
                rows="3" v-model="inputLinks" style="word-wrap : break-word;">
                </textarea>
              </div>            
            </form>   
          <div>結果:</div>
          <table class="table" id="profileTable" v-if="visibility == 'profile'">
            <thead>
              <tr class="table-active">
                <th data-field="id">ID</th>
                <th data-field="link" colspan="4">link</th>
                <th data-field="progress">progress</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in showProfileList(profileData)" :key="item">
                <th>{{ item.id }}</th>
                <th colspan="4" style="word-break:break-all;">{{ item.link }}</th>
                <th style="text-align: center">
                  <span class="fui-check" v-if="item.data !== ''" style="color:#32CD32;"></span>
                </th>
              </tr>
            </tbody>
          </table>
          <div>
            <button class="button" id="button" v-on:click="saveInputLink">
              <span class="fui-search"></span>&ensp;送出連結
            </button>
            <button class="button" id="downloadProfileBtn" v-on:click="downloadProfileData">
              <span class="fui-clip"></span>&ensp;下載結果
            </button> 
            <button class="button" id="clearProfileBtn" v-on:click="clearProfileData">
              <span class="fui-trash"></span>&ensp;清除資料
            </button> 
          </div>
        </div>

        <div v-if="visibility == 'comment'">
          <div>結果:</div>
          <table class="table" id="commentTable">
            <thead>
              <tr class="table-active">
                <th data-field="id2">ID</th>
                <th data-field="name">name</th>
                <th colspan="4" data-field="content">comment</th>
                <th data-field="level">level</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in showCommentList(commentData)" :key="item">
                <th>{{ item.id }}</th>
                <th>{{ item.name }}</th>
                <th colspan="4" style="word-break:break-all;">{{ item.content }}</th>
                <th>{{ item.level }}</th>
              </tr>
            </tbody>
          </table>
          <div>
            <button class="button" id="commentBtn" v-on:click="fetchComment">
              <span class="fui-bubble"></span>&ensp;取得留言
            </button>
            <button class="button" id="downloadCommentBtn" v-on:click="downloadCommentData">
              <span class="fui-clip"></span>&ensp;下載結果
            </button>
            <button class="button" id="clearCommentBtn" v-on:click="clearCommentData">
              <span class="fui-trash"></span>&ensp;清除資料
            </button> 
          </div>
        </div>
      </div>
    </div> 
  </div>
</template>

<script>
const browser = require("webextension-polyfill");
const { Parser } = require("json2csv");

export default {
  data() {
    return {
      profileData: {},
      commentData: {},
      visibility: 'profile'
    };
  },

  methods: {
    saveInputLink: function() {
      console.log("start to save origin  input links");
      chrome.storage.local.set({ profile: { data: "", state: "" } }, function() {});
      if(this.inputLinks == null || this.inputLinks.trim() == "") console.log('no input');
      else{
        let links = this.inputLinks.split(",");
        var link_arr = [];
        var j = 1;
        for (let i = 0; i < links.length; i++) {
          let item_obj = {};
          let url_pattern = "www.facebook.com";
          if (links[i].search(url_pattern) >= 0) {
            let id = j;
            item_obj.id = id;
            item_obj.link = links[i].replace(/(\r\n|\n|\r)/gm, "");
            item_obj.data = "";
            item_obj.state = "";
            link_arr.push(item_obj);
            j++;
          }
        }
        let len = link_arr.length;
        link_arr.push({ len: len });
        let link_obj = { ...link_arr };
        console.log("input links:", link_obj);
        this.profileData = link_obj;
        console.log("Vue profile data:", this.profileData);
        chrome.storage.local.set({ profile: { data: link_obj } }, function() {
          console.log("save origin links finish");
        });

      }  
    },

    downloadProfileData: function() {
      chrome.storage.local.get("profile", function(item) {
        let origin_item = item.profile.data;
        if (!origin_item[0].hasOwnProperty("len")) {
          let keys = Object.keys(origin_item);
          let output_array = [];
          for (const key of keys) {
            if ( !origin_item[key].hasOwnProperty("len") && origin_item[key].data !== "") output_array.push(origin_item[key]);
          }
          const fields = [
            { label: "id", value: "id" },
            { label: "link", value: "link" },
            { label: "user_ID", value: "data.ID" },
            { label: "user_name", value: "data.name" },
            { label: "user_img", value: "data.img" }
          ];
          const json2csvParser = new Parser({ fields });
          const csv = json2csvParser.parse(output_array);
          console.log(csv);
          var hiddenElement = document.createElement("a");
          hiddenElement.href =
            "data:text/csv;charset=utf-8,\uFEFF" + encodeURI(csv);
          hiddenElement.target = "_blank";
          hiddenElement.download = "link_profile_data.csv";
          hiddenElement.click();
        }
      });
    },

    clearProfileData: function() {
      chrome.storage.local.set({comment: { state: "", data: "" }}, function() {});
    },

    showProfileList: function(items) {
      let origin_item = items;
      var keys = Object.keys(origin_item);
      let arr = [];
      for (const key of keys) {
        if (!origin_item[key].hasOwnProperty("len")) {
          arr.push(origin_item[key]);
        }
      }
      return arr;
    },

    showCommentList: function(items) {
      let origin_item = items;
      var keys = Object.keys(origin_item);
      let arr = [];
      for (const key of keys) {
        arr.push(origin_item[key]);
      }
      return arr;
    },

    downloadCommentData: function() {
      chrome.storage.local.get("comment", function(item) {
        let origin_item = item.comment.data;
        if (origin_item !== "") {
          let keys = Object.keys(origin_item);
          let output_array = [];
          for (const key of keys) {
            output_array.push(origin_item[key]);
          }
          const fields = [
            { label: "comment_ID", value: "comment_id" },
            { label: "reply_comment_id", value: "reply_comment_id" },
            { label: "user_ID", value: "user_id" },
            { label: "time", value: "time" },
            { label: "name", value: "name" },
            { label: "content", value: "content" },
            { label: "like", value: "like" },
            { label: "level", value: "level" }
          ];
          const json2csvParser = new Parser({ fields });
          const csv = json2csvParser.parse(output_array);
          console.log(csv);
          var hiddenElement = document.createElement("a");
          hiddenElement.href =
            "data:text/csv;charset=utf-8,\uFEFF" + encodeURI(csv);
          hiddenElement.target = "_blank";
          hiddenElement.download = "comment_data.csv";
          hiddenElement.click();
        }

      })
    },

    fetchComment: function() {
      chrome.storage.local.set({comment: { state: "", data: "" }}, function() {});
      chrome.storage.local.set({ comment: { state: "fetch_comment", data: "" } }, function() {});
    },

    clearCommentData: function() {
      chrome.storage.local.set({comment: { state: "", data: "" }}, function() {});
    }
  },

  mounted: function() {
    var _this = this;
    chrome.storage.local.set(
      { comment: { state: "", data: "" }, profile: { data: "", state: "" } },
      function() {
        console.log("set initial");
      }
    );

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        console.log("changes:", changes);
        var storage_keys = Object.keys(changes);
        for (const storage_key of storage_keys) {
          if (storage_key == "comment") {
            chrome.storage.local.get("comment", function(item) {
              _this.commentData = item.comment.data;
            });
          } else if (storage_key == "profile") {
            chrome.storage.local.get("profile", function(item) {
              _this.profileData = item.profile.data;

              let origin_item = item.profile.data;
              var keys = Object.keys(origin_item);

              for (const key of keys) {
                if (
                  !origin_item[key].hasOwnProperty("len") &&
                  origin_item[key].data == ""
                ) {
                  let goto_url = origin_item[key].link;
                  console.log("ready to:", goto_url);
                  chrome.tabs.update({ url: goto_url });
                  break;
                } else if (
                  !origin_item[0].hasOwnProperty("len") &&
                  origin_item[key].hasOwnProperty("len")
                ) {                
                  let output_items = origin_item;
                  let keys = Object.keys(output_items);
                  for (const key of keys) {
                    if (!output_items[key].hasOwnProperty("len")) {
                      let item_data = output_items[key].data;
                      let ID = item_data.ID;
                      let name = item_data.name;
                      let img = item_data.img;
                      let items = { ID, name, img };
                      console.log("output item:", items);
                    }
                  }
                  console.log("output all finish");
                  break;
                }
              }
            });
          }
        }
      });

      chrome.tabs.onUpdated.addListener(function(tabID, changeInfo, tab) {
        if (changeInfo.status == "complete") {
          chrome.storage.local.get("profile", function(item) {
            let origin_item = item.profile.data;
            var keys = Object.keys(origin_item);
            for (const key of keys) {
              if (
                !origin_item[key].hasOwnProperty("len") &&
                origin_item[key].state == ""
              ) {
                origin_item[key].state = "fetch";
                console.log(
                  "origin item:",
                  origin_item[key],
                  "start to fetch profile data"
                );
                chrome.storage.local.set({ profile: { data: origin_item } }, function() {});
                break;
              }
            }
          });
        }
      });
    });
  }
};
</script>

<style lang="scss" scoped>
#app {
  width: 500px;
  font-family: Microsoft JhengHei;
}
p {
    font-size: 16px;
}
.card{
  margin: 10px;
}

html,body,#app{
  height: 100%;
}
</style>
