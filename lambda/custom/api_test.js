'use strict';
var Alexa = require("alexa-sdk");
const superagent = require("superagent");
var api_url = "https://api.gnavi.co.jp/RestSearchAPI/20150630";
const api_key = "";
const city = "浜松市中区";

// "https://api.gnavi.co.jp/RestSearchAPI/20150630/?keyid=a0d5d4430cd8ec29bec71118e75315d2&format=json&area=AREA130&address=%E6%B5%9C%E6%9D%BE%E5%B8%82&hit_per_page=100&category_l=RSFST08000&category_s=RSFST08008"

function searchRamenStores(city, callback){
  superagent.get(api_url)
  .query({
    keyid: api_key,
    address: city,
    format: "json",
    area: "AREA130", //中部
    // sunday_open: "1", // 日曜営業(option)
    hit_per_page: "100",
    category_l: "RSFST08000", //大業態コード
    category_s: "RSFST08008" //小業態コード
  })
  .end(function(err, res){
      if (err){ console.log(err); }
      var result = JSON.parse(res.text);
      callback(result);
  }.bind(this));
}

function getRandomIndex(max){
  return Math.floor(Math.random(max) * max);
}

function selectRandomRamenStores(ramen_stores){
  var random_array = [];
  var store_max = ramen_stores.length;
  for (var i = 0; i < 5; i++) {
    var index = getRandomIndex(store_max);
    random_array.push(ramen_stores[index].name_kana);
  }
  return random_array;
}

searchRamenStores(city, function(result){
  var msg = city + "のラーメン屋を検索しました。";
  if (result.error){
    msg = city + "にラーメン屋が見つかりませんでした。他の場所を探してください。";
  }
  else {
    if (result.rest.length > 0){
      var stores = result.rest.map(function(row){
        return {
          name: row.name,
          name_kana: row.name_kana,
          address: row.address
        };
      });

      var store_names = [];
      msg += result.rest.length + "件の検索結果のうち、5件抽出します。";
      msg += selectRandomRamenStores(result.rest).join(", ") + "。";
      msg += "番号を選択するか、「再検索」と言ってください。"
      msg += store_names.map(function(store_name, i) {
        return (i + 1) + ". " + store_name;
      }).join("、");
      
    }
  }

  console.log(msg);
});