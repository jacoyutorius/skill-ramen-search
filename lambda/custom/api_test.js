'use strict';
var Alexa = require("alexa-sdk");
const superagent = require("superagent");
var api_url = "https://api.gnavi.co.jp/RestSearchAPI/20150630";
const city = "浜松市中区";

function searchRamenStores(city, callback){
  superagent.get(api_url)
  .query({keyid: "63499951ce2e3eedafd3aa916ac93559", address: city, format: "json", freeword: "ラーメン" })
  .end(function(err, res){
      if (err){ console.log(err); }
      var result = JSON.parse(res.text);
      callback(result);
  }.bind(this));
}

function getRandomIndex(){
  return Math.floor(Math.random(10) * 10);
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
      msg +=　result.rest.length + "件の検索結果のうち、5件抽出します。";
      msg += "";
      for(var i = 0; i < 5; i ++){
        var index = getRandomIndex();
        store_names.push((i + 1) + ". " + stores[index].name_kana);
      }

      msg += store_names.join(", ");
      msg += "番号を選択するか、「再検索」と言ってください。"
    }
  }

  console.log(msg);
});