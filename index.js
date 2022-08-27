// ==UserScript==
// @name         Twitter bot
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  auto retweet, follow, comment
// @author       You
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==

function addGlobalStyle(css) {
  var head, style;
  head = document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }
  style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css.replace(/;/g, " !important;");
  head.appendChild(style);
}

const css = `
  .twitter-bot {
    position: absolute;
    top: -2px;
    width: 100%;
    text-align: center;
    padding: 0 12px;
    box-sizing: border-box;
  }
  .twitter-bot * {
    box-sizing: border-box;
  }
  .twitter-bot--toggle {
    background: white;
    border: 1px solid #d9d9d9;
    padding: 8px 20px;
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    font-weight: bold;
  }
  .twitter-bot--toggle::after {
  content: "";
  position: absolute;
  bottom: -9px;
    left: 28px;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #dbdbdb;
  }
  .twitter-bot--config {
    height: 0px;
    transition: height 1s;
    box-shadow: rgb(0 0 0 / 24%) 0px 3px 8px;
    background: white;
    position: relative;
    display: flex;
    overflow: hidden;
  }
  .twitter-bot--open .twitter-bot--config {
    height: 680px;
    display: flex;
    flex-direction: column;
  }

  .twitter-bot--form textarea {
    padding: 10px;
    max-width: 100%;
    line-height: 1.5;
    border-radius: 5px;
    border: 1px solid #ddd;
  }

  .twitter-bot--form textarea:focus {
    outline: none;
  }

  .twitter-bot--form input {
    padding: 10px;
    border-radius: 4px;
    outline: none;
    border: 1px solid #c9c9c9;
    width: 100%;
  }

  .bot-form--tweets label {
    display: block;
    margin-bottom: 10px;
  }
  .bot-checkbox {
    display: block;
    position: relative;
    padding-left: 24px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 16px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .bot-checkbox  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 16px;
    width: 16px;
    background-color: #eee;
    border-radius: 4px;
  }
  .bot-checkbox:hover input ~ .checkmark {
    background-color: #ccc;
  }
  .bot-checkbox input:checked ~ .checkmark {
    background-color: #2196F3;
  }
  .bot-checkbox input:checked ~ .checkmark:after {
    display: block;
  }
  .bot-checkbox .checkmark:after {
    left: 9px;
    top: 5px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }
  .twitter-bot--donate {
    text-align: right;
    padding: 20px;
    border-bottom: 1px solid #ebebeb;
    margin-bottom: 20px;
  }
  .twitter-bot--box {
    display: flex;
  }
  .twitter-bot--form {
    width: 40%;
  }
  .bot-form--header {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
  }
  .bot-form--content {
    text-align: left;
    padding: 0 24px;
  }
  .bot-form--tweets {
    margin-bottom: 16px;
  }
  .bot-form--tweets textarea {
    width: 100%;
  }

  .twitter-bot--result {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .twitter-bot--title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
  }
  .result-item span {
    margin-left: 8px;
  }
  .success span {
    color: #00dd1b;
  }
  .error span {
    color: tomato;
  }
  .error-detail {
    display: none;
  }
  .bot-form--submit {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
  .bot-form--submit button {
    background: #1c98eb;
    border: none;
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;
    color: white;
  }
  .bot-form--submit button:disabled {
    background: #6da1c5;
    cursor: no-drop;
  }
  .twitter-bot--list {
    max-height: 400px;
    overflow-y: scroll;
  }
`;

// ****************** Handle logic call api twitter ************************* //
const favoriteTweetQueryId = "lI07N6Otwv1PhnEgXILM7A";
const getDetailTweetQueryId = "7i51yEC2i_iurfMKZ8mcNw";
const createRetweetQueryId = "ojPdsZsimiJrUGLR1sjUtA";
const createTweetQueryId = "sRwUG9yq5p8bdGRhIIywDA";

const xCsrfToken = document.cookie
  .split("; ")
  .find((item) => item.includes("ct0="))
  .split("=")[1];

function setHeaders(xhr, authorization, notSetJson) {
  xhr.setRequestHeader("authorization", authorization);
  xhr.setRequestHeader("x-csrf-token", xCsrfToken);
  xhr.setRequestHeader("x-twitter-active-user", "yes");
  xhr.setRequestHeader("x-twitter-auth-type", "OAuth2Session");
  xhr.setRequestHeader("x-twitter-client-language", "en");
  if (!notSetJson) {
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  }
}

function favoriteTweet(authorization, tweetId) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://twitter.com/i/api/graphql/${favoriteTweetQueryId}/FavoriteTweet`,
      true
    );
    setHeaders(xhr, authorization);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.response);
      }
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.send(
      JSON.stringify({
        queryId: favoriteTweetQueryId,
        variables: {
          tweet_id: tweetId,
        },
      })
    );
  });
}

function createRetweet(authorization, tweetId) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://twitter.com/i/api/graphql/${createRetweetQueryId}/CreateRetweet`,
      true
    );
    setHeaders(xhr, authorization);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.response);
      }
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.send(
      JSON.stringify({
        queryId: createRetweetQueryId,
        variables: {
          tweet_id: tweetId,
          dark_request: false,
        },
      })
    );
  });
}

function followUser(authorization, userId) {
  return new Promise((resolve, reject) => {
    const data = new FormData();
    data.append("include_profile_interstitial_type", 1);
    data.append("include_blocking", 1);
    data.append("include_blocked_by", 1);
    data.append("include_followed_by", 1);
    data.append("include_want_retweets", 1);
    data.append("include_mute_edge", 1);
    data.append("include_can_dm", 1);
    data.append("include_can_media_tag", 1);
    data.append("include_ext_has_nft_avatar", 1);
    data.append("skip_status", 1);
    data.append("user_id", userId);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://twitter.com/i/api/1.1/friendships/create.json`,
      true
    );
    setHeaders(xhr, authorization, true);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.response);
      }
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.send(data);
  });
}

function createComment(authorization, tweetId, comment) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://twitter.com/i/api/graphql/${createTweetQueryId}/CreateTweet`,
      true
    );
    setHeaders(xhr, authorization);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.response);
      }
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.send(
      JSON.stringify({
        queryId: createTweetQueryId,
        features: {
          dont_mention_me_view_api_enabled: true,
          interactive_text_enabled: true,
          responsive_web_uc_gql_enabled: true,
          vibe_api_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
          responsive_web_enhance_cards_enabled: true,
        },
        variables: {
          tweet_text: comment,
          reply: {
            in_reply_to_tweet_id: tweetId,
            exclude_reply_user_ids: [],
          },
          media: {
            media_entities: [],
            possibly_sensitive: false,
          },
          withDownvotePerspective: false,
          withReactionsMetadata: false,
          withReactionsPerspective: false,
          withSuperFollowsTweetFields: true,
          withSuperFollowsUserFields: true,
          semantic_annotation_ids: [],
          dark_request: false,
        },
      })
    );
  });
}

function getUserMentions(authorization, tweetId) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `https://twitter.com/i/api/graphql/${getDetailTweetQueryId}/TweetDetail?variables=%7B%22focalTweetId%22%3A%22${tweetId}%22%2C%22with_rux_injections%22%3Afalse%2C%22includePromotedContent%22%3Atrue%2C%22withCommunity%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withBirdwatchNotes%22%3Afalse%2C%22withSuperFollowsUserFields%22%3Atrue%2C%22withDownvotePerspective%22%3Afalse%2C%22withReactionsMetadata%22%3Afalse%2C%22withReactionsPerspective%22%3Afalse%2C%22withSuperFollowsTweetFields%22%3Atrue%2C%22withVoice%22%3Atrue%2C%22withV2Timeline%22%3Atrue%7D&features=%7B%22unified_cards_follow_card_query_enabled%22%3Afalse%2C%22dont_mention_me_view_api_enabled%22%3Atrue%2C%22interactive_text_enabled%22%3Atrue%2C%22responsive_web_uc_gql_enabled%22%3Atrue%2C%22vibe_api_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Atrue%7D`,
      true
    );
    setHeaders(xhr, authorization);

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const owner = JSON.parse(xhr.response).data
            .threaded_conversation_with_injections_v2.instructions[0].entries[0]
            .content.itemContent.tweet_results.result.legacy.user_id_str;
          const userMentions = JSON.parse(
            xhr.response
          ).data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result.legacy.entities.user_mentions.map(
            (el) => el.id_str
          );
          const users = [owner, ...userMentions];
          const filterDuplicate = users.filter((item, pos) => {
            return users.indexOf(item) === pos;
          });

          resolve(filterDuplicate);
        } else {
          reject(xhr.response);
        }
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.send(null);
  });
}

// ****************** Handle logic run bot ************************* //

let events = [];

async function awaitMillisecond(fn, millisecond) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        resolve(await fn());
      } catch (err) {
        reject(err);
      }
    }, millisecond);
  });
}

async function startBot() {
  document.querySelector("#twitter-bot-start").disabled = true;

  const tweetsValue = document.querySelector("#twitter-bot-tweets").value;
  const isAutoFavorite = document.querySelector(
    "#twitter-bot-favorite"
  ).checked;
  const isAutoRetweet = document.querySelector("#twitter-bot-retweet").checked;
  const isAutoFollow = document.querySelector("#twitter-bot-follow").checked;
  const isAutoComment = document.querySelector(
    "#twitter-bot-comment-checkbox"
  ).checked;
  const commentContent = document.querySelector("#twitter-bot-comment").value;
  const authorization = document.querySelector(
    "#twitter-bot-authorization"
  ).value;
  const millisecond = document.querySelector("#twitter-bot-millisecond").value;

  if (!authorization.trim()) {
    return alert("Please enter authorization!");
  }
  if (!tweetsValue.trim()) {
    return alert("Please enter tweets!");
  }
  if (isAutoComment && !commentContent.trim()) {
    return alert("Please enter comment!");
  }

  if (!isAutoFavorite && !isAutoRetweet && !isAutoFollow && !isAutoComment) {
    return alert("Please select at least auto action!");
  }

  document.querySelector(".twitter-bot--list").innerHTML = "";

  let tweets;
  if (tweetsValue.includes("\r\n")) {
    tweets = tweetsValue.split("\r\n");
  } else if (tweetsValue.includes("\r")) {
    tweets = tweetsValue.split("\r");
  } else {
    tweets = tweetsValue.split("\n");
  }

  const filterValidTweets = tweets
    .map((tweet) => tweet.trim())
    .filter((item, pos) => {
      return item && tweets.indexOf(item) === pos;
    });

  tweets = filterValidTweets.map((tweet) => ({
    url: tweet,
    tweetId: tweet.split("/")[tweet.split("/").length - 1].split("?")[0],
  }));

  const defaultError =
    '{"errors":[{"message":"NumericString value expected. Received 15624798458455040002321312","extensions":{"name":"MalformedVariablesError","source":"Client","code":366,"kind":"Validation","tracing":{"trace_id":"b9db0465bae9c318"}},"code":366,"kind":"Validation","name":"MalformedVariablesError","source":"Client","tracing":{"trace_id":"b9db0465bae9c318"}}]}';
  let errors = [];

  for (let tweet of tweets) {
    const { tweetId, url } = tweet;
    try {
      if (isAutoFavorite)
        await awaitMillisecond(async () => {
          await favoriteTweet(authorization, tweetId);
        }, millisecond);
      if (isAutoRetweet)
        await awaitMillisecond(async () => {
          await createRetweet(authorization, tweetId);
        }, millisecond);
      if (isAutoComment)
        await awaitMillisecond(async () => {
          await createComment(authorization, tweetId, commentContent);
        }, millisecond);

      if (isAutoFollow) {
        const userMentions = await awaitMillisecond(async () => {
          return await getUserMentions(authorization, tweetId);
        }, millisecond);
        for (let userId of userMentions) {
          await awaitMillisecond(async () => {
            await followUser(authorization, userId);
          }, millisecond);
        }
      }

      document.querySelector(".twitter-bot--list").insertAdjacentHTML(
        "beforeend",
        `
        <div class="result-item success">
          <a target="_blank" href="${url}">${url}</a>
          <span> -   Done</span>
        </div>
      `
      );
    } catch (error) {
      console.log("error", {
        error,
      });
      document.querySelector(".twitter-bot--list").insertAdjacentHTML(
        "beforeend",
        `
        <div class="result-item error">
          <a target="_blank" href="${url}">${url}</a>
          <span id="error-${tweetId}"> -   Error</span>
        </div>
      `
      );
      errors.push({
        tweetId: tweetId,
        error: defaultError,
      });
    }
  }

  for (let error of errors) {
    document.querySelector(`#error-${error.tweetId}`).onclick = () => {
      alert(error.error);
    };
  }

  localStorage.setItem(
    "twitter-bot",
    JSON.stringify({
      isAutoFavorite,
      isAutoRetweet,
      isAutoFollow,
      isAutoComment,
      commentContent,
      authorization,
      millisecond,
    })
  );

  document.querySelector("#twitter-bot-start").disabled = false;
}

// ***************** Handle render **************************//

(function () {
  "use strict";
  addGlobalStyle(css);

  const {
    isAutoFavorite,
    isAutoRetweet,
    isAutoFollow,
    isAutoComment,
    commentContent,
    authorization,
    millisecond,
  } = localStorage.getItem("twitter-bot")
    ? JSON.parse(localStorage.getItem("twitter-bot"))
    : {
        isAutoFavorite: true,
        isAutoRetweet: true,
        isAutoFollow: true,
        isAutoComment: true,
        authorization: "",
        commentContent: "",
        millisecond: 1000,
      };

  let div = document.createElement("div");
  div.classList.add("twitter-bot");
  div.innerHTML = `
  <div class="twitter-bot--config">
     <div class="twitter-bot--donate">
       <span><b>Donate:</b></span><span style="margin-left: 5px;">0xC9d60454152F19ab50d0fdB983f81bD1f0d0967F</span>
     </div>
     <div class="twitter-bot--box">
     <div class="twitter-bot--form">
        <div class="bot-form--header">Twitter Bot</div>

        <div class="bot-form--content">
          <div class="bot-form--tweets">
            <label for="authorization">Authorization:</label>
            <input value="${authorization}" id="twitter-bot-authorization" placeholder="Enter authorization" id="authorization" name="authorization">
          </div>
          <div class="bot-form--tweets">
            <label for="millisecond">Delay (millisecond):</label>
            <input value="${millisecond}" id="twitter-bot-millisecond" placeholder="Enter millisecond" id="millisecond" name="millisecond">
          </div>
          <div class="bot-form--tweets">
            <label for="story">Tweets:</label>
            <textarea id="twitter-bot-tweets" placeholder="Enter tweets" id="story" name="story"
                    rows="5"></textarea>
          </div>
          
          <label class="bot-checkbox">Auto Favorite
            <input id="twitter-bot-favorite" type="checkbox" ${
              isAutoFavorite ? "checked" : ""
            }>
            <span class="checkmark"></span>
          </label>
          <label class="bot-checkbox">Auto Retweet
            <input id="twitter-bot-retweet" type="checkbox" ${
              isAutoRetweet ? "checked" : ""
            }>
            <span class="checkmark"></span>
          </label>
          <label class="bot-checkbox">Auto Follow Users Mention
            <input id="twitter-bot-follow" type="checkbox" ${
              isAutoFollow ? "checked" : ""
            }>
            <span class="checkmark"></span>
          </label>
          <label class="bot-checkbox">Auto Comment
            <input id="twitter-bot-comment-checkbox" type="checkbox" ${
              isAutoComment ? "checked" : ""
            }>
            <span class="checkmark"></span>
          </label>
          <input value="${commentContent}" id="twitter-bot-comment" placeholder="Enter comment">
          <div class="bot-form--submit">
            <button id="twitter-bot-start">Start</button>
          </div>
        </div>
     </div>

     <div class="twitter-bot--result">
      <div class="twitter-bot--title">
        Result
      </div>
        <div class="twitter-bot--list">
          
        </div>
     </div>
     </div>
  </div>
  <button class="twitter-bot--toggle">Open</button>
  `;
  document.querySelector("body").appendChild(div);

  document.querySelector(".twitter-bot--toggle").onclick = (e) => {
    document
      .querySelector(".twitter-bot")
      .classList.toggle("twitter-bot--open");
  };

  document.querySelector("#twitter-bot-start").onclick = (e) => {
    startBot();
  };

  // Your code here...
})();
