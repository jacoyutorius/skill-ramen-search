'use strict';
var Alexa = require("alexa-sdk");
const superagent = require("superagent");
var api_url = "https://api.gnavi.co.jp/RestSearchAPI/20150630";
const api_key = "";
const city = "浜松市中区";

exports.handler = function(event, context) {
  var alexa = Alexa.handler(event, context);
  alexa.dynamoDBTableName = 'RamenSearchSkillTable';
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var handlers = {
  'LaunchRequest': function() {
    this.emit('AMAZON.HelpIntent');
  },
  'HelloWorldIntent': function() {
    this.emit('AMAZON.HelpIntent');
  },
  // 'MyNameIsIntent': function() {
  //   this.emit('SayHelloName');
  // },
  // 'SayHello': function() {
  //   this.response.speak('Hello World!')
  //     .cardRenderer('hello world', 'hello world');
  //   this.emit(':responseReady');
  // },
  // 'SayHelloName': function() {
  //   var name = this.event.request.intent.slots.name.value;
  //   this.response.speak('Hello ' + name)
  //     .cardRenderer('hello world', 'hello ' + name);
  //   this.emit(':responseReady');
  // },
  'SessionEndedRequest': function() {
    console.log('Session ended with reason: ' + this.event.request.reason);
  },
  'AMAZON.StopIntent': function() {
    this.response.speak('Bye');
    this.emit(':responseReady');
  },
  'AMAZON.HelpIntent': function() {
    this.response.speak("このように話してください。'アレクサ、ラーメン検索で浜松市のラーメン屋を探して'");
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function() {
    this.response.speak('Bye');
    this.emit(':responseReady');
  },
  'Unhandled': function() {
    this.response.speak("Sorry, I didn't get that. You can try: 'alexa, hello world'" +
      " or 'alexa, ask hello world my name is awesome Aaron'");
  },
  'SelectRamenStoreIntent': function() {
    if (this.attributes["city"]) {
      var msg = "";
      if (this.event.request.intent.slots.re_select.value) {
        this.attributes["ramen_store_names"] = selectRandomRamenStores(this.attributes["ramen_stores"]);

        msg = "では、こちらはどうでしょう？";
        msg += this.attributes["ramen_store_names"].map(function(store_name, i) {
          return (i + 1) + ". " + store_name;
        }).join("、");

        this.emit(":ask", msg);
      }
      else {
        var index = this.event.request.intent.slots.index.value
        var store_name = this.attributes["ramen_store_names"][index - 1];
        msg += store_name + "ですね。";

        var store = this.attributes["ramen_stores"].find(function(store) {
          if (store.name_kana === store_name) {
            return true;
          }
        }.bind(this));
        msg += "住所は" + store.address + "です。";

        this.attributes["city"] = undefined;
        this.attributes["ramen_stores"] = undefined;
        this.attributes["ramen_store_names"] = undefined;

        this.emit(":tell", msg);
      }
    }
    else {
      this.emit('AMAZON.HelpIntent');
    }
  },
  'AskCityIntent': function() {
    var city = this.event.request.intent.slots.city.value;
    this.attributes["city"] = city;

    searchRamenStores(city, function(result) {
      var msg = city + "のラーメン屋を検索しました。";

      // this.attributes["city"] = undefined;
      // this.attributes["ramen_stores"] = undefined;
      // this.attributes["ramen_store_names"] = undefined;

      if (result.error) {
        msg = city + "にラーメン屋が見つかりませんでした。他の場所を探してください。";
      }
      else {
        if (result.rest.length > 0) {
          var stores = result.rest.map(function(row) {
            return {
              name: row.name,
              name_kana: row.name_kana,
              address: row.address
            };
          });
          this.attributes["ramen_stores"] = stores;

          msg += 　result.rest.length + "件の検索結果のうち、5件抽出します。";
          this.attributes["ramen_store_names"] = selectRandomRamenStores(stores);

          msg += "番号を選択するか、「再検索」と言ってください。"
          msg += this.attributes["ramen_store_names"].map(function(store_name, i) {
            return (i + 1) + ". " + store_name;
          }).join("、");
        }
      }

      console.log(msg);
      this.emit(':ask', msg);
    }.bind(this));
  }
};

function searchRamenStores(city, callback) {
  superagent.get(api_url)
    .query({
      keyid: api_key,
      address: city,
      format: "json",
      area: "AREA130", //とりあえず「中部」でハードコード
      hit_per_page: "100",
      category_l: "RSFST08000", //大業態コード
      category_s: "RSFST08008" //小業態コード
    })
    .end(function(err, res) {
      if (err) { console.log(err); }
      var result = JSON.parse(res.text);
      callback(result);
    }.bind(this));
}

function selectRandomRamenStores(ramen_stores) {
  if (ramen_stores.length <= 0) {
    return [];
  }

  var random_array = [];
  for (var i = 0; i < 5; i++) {
    var index = getRandomIndex(ramen_stores.length);
    random_array.push(ramen_stores[index].name_kana);
  }
  return random_array;
}

function getRandomIndex(max) {
  return Math.floor(Math.random(max) * max);
}
