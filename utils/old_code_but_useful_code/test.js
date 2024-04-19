
// fetch("https://codepen.io/graphql", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-GB,en;q=0.7",
//     "cache-control": "no-cache",
//     "content-type": "application/json",
//     "pragma": "no-cache",
//     "sec-ch-ua": "\"Brave\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "sec-gpc": "1",
//     "x-csrf-token": "+5Cbz3mb2abNliO9EpNaa9repNyFVtwsglJ6kjI4KEOCAYJaqtsTDbIjNc7cQIeaop3KwN4XAXHsoRMs36swDg==",
//     "x-requested-with": "XMLHttpRequest",
//     "cookie": "__editor_layout=top; cf_clearance=MiwV9IImMMgJPAhWlV9oDu6.Ji8JYf6bkZxO46C9bsg-1712950021-1.0.1.1-9bNSzwm_0GsLJvMtIaF7CG5hWTBlDJkLExt9Ycgp71i0DqelfkMZ4d2An3INckK4NthCdiyT7hbElwAYYzEbQQ; codepen_signup_referrer=https://search.brave.com/; codepen_signup_referrer_date=2024-04-12T20:29:53.782Z; __cf_bm=ZeFpAv6bLibU9gZghk5fuJfmCbozhdx0bH.fELUjNp0-1713096712-1.0.1.1-wHT4iMDSULwihdlKHnXc1iigtwzq3ciieO20gU9AIVVingpa25E0URA7EOuEpsc3GVk24daNChd2m5nouY48nQ; cp_session=tHtmQNbD%2F4qFhvaf--9QCETZtpDrYmxtEqc64uoamUQndA972YEAuNbWEbRoBIr2AOO4l%2BtNxAQOxrOBnPrjob4wvxjZ4%2BxHzIsC416uMvc%2BNaNzb2lbhZRqK1wY%2F%2BRa28GPwBpcn72q1Gp%2BXy8JteYGxd0FaLRoo%2Bv5QwX%2B1p38TW7vPiEYd39uV0Wz36sXqXtJJZHLJdNX8O11y5MqoL6d%2BFeCfRiQ%3D%3D--TxFAekshwjzhLsvbNHVuhw%3D%3D",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "[{\"operationName\":\"ItemTitleQuery\",\"variables\":{\"id\":\"wvPvjLX\",\"itemType\":\"Pen\"},\"query\":\"query ItemTitleQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    itemType\\n    title\\n    owner {\\n      id\\n      title\\n      sessionUser {\\n        id\\n        followsOwner\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  sessionUser {\\n    id\\n    currentContext {\\n      id\\n      title\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"},{\"operationName\":\"ShareDropdownQuery\",\"variables\":{\"id\":\"wvPvjLX\",\"itemType\":\"Pen\"},\"query\":\"query ShareDropdownQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    ... on Pen {\\n      cpid\\n      __typename\\n    }\\n    token\\n    title\\n    private\\n    description {\\n      source {\\n        body\\n        __typename\\n      }\\n      __typename\\n    }\\n    url\\n    sessionUser {\\n      id\\n      ownsItem\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]", "method": "POST"
// })
//   .then(response => response.text())  // convert to text
//   .then(text => console.log(text))    // log the text
//   .catch(error => console.error(error));  // log any error


async function shart() {
  let codepenId = "wvPvjLX"
  let req = await fetch("https://codepen.io/graphql", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-GB,en;q=0.7",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Brave\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "x-csrf-token": "+5Cbz3mb2abNliO9EpNaa9repNyFVtwsglJ6kjI4KEOCAYJaqtsTDbIjNc7cQIeaop3KwN4XAXHsoRMs36swDg==",
      "x-requested-with": "XMLHttpRequest",
      "cookie": "__editor_layout=top; cf_clearance=MiwV9IImMMgJPAhWlV9oDu6.Ji8JYf6bkZxO46C9bsg-1712950021-1.0.1.1-9bNSzwm_0GsLJvMtIaF7CG5hWTBlDJkLExt9Ycgp71i0DqelfkMZ4d2An3INckK4NthCdiyT7hbElwAYYzEbQQ; codepen_signup_referrer=https://search.brave.com/; codepen_signup_referrer_date=2024-04-12T20:29:53.782Z; __cf_bm=ZeFpAv6bLibU9gZghk5fuJfmCbozhdx0bH.fELUjNp0-1713096712-1.0.1.1-wHT4iMDSULwihdlKHnXc1iigtwzq3ciieO20gU9AIVVingpa25E0URA7EOuEpsc3GVk24daNChd2m5nouY48nQ; cp_session=tHtmQNbD%2F4qFhvaf--9QCETZtpDrYmxtEqc64uoamUQndA972YEAuNbWEbRoBIr2AOO4l%2BtNxAQOxrOBnPrjob4wvxjZ4%2BxHzIsC416uMvc%2BNaNzb2lbhZRqK1wY%2F%2BRa28GPwBpcn72q1Gp%2BXy8JteYGxd0FaLRoo%2Bv5QwX%2B1p38TW7vPiEYd39uV0Wz36sXqXtJJZHLJdNX8O11y5MqoL6d%2BFeCfRiQ%3D%3D--TxFAekshwjzhLsvbNHVuhw%3D%3D",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "[{\"operationName\":\"ItemTitleQuery\",\"variables\":{\"id\":\"" + codepenId + "\",\"itemType\":\"Pen\"},\"query\":\"query ItemTitleQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    itemType\\n    title\\n    owner {\\n      id\\n      title\\n      sessionUser {\\n        id\\n        followsOwner\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  sessionUser {\\n    id\\n    currentContext {\\n      id\\n      title\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"},{\"operationName\":\"ShareDropdownQuery\",\"variables\":{\"id\":\"" + codepenId + "\",\"itemType\":\"Pen\"},\"query\":\"query ShareDropdownQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    ... on Pen {\\n      cpid\\n      __typename\\n    }\\n    token\\n    title\\n    private\\n    description {\\n      source {\\n        body\\n        __typename\\n      }\\n      __typename\\n    }\\n    url\\n    sessionUser {\\n      id\\n      ownsItem\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]", "method": "POST"
  }).then(data => {
    return data.text()
  })
    .catch(error => console.error('Error:', error));

  console.log(req);

}

shart()

// Fetch code

//         fetch("https://codepen.io/graphql", {
//             "headers": {
//             "accept": "*/*",
//             "accept-language": "en-GB,en;q=0.7",
//             "cache-control": "no-cache",
//             "content-type": "application/json",
//             "pragma": "no-cache",
//             "sec-ch-ua": "\"Brave\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
//             "sec-ch-ua-mobile": "?0",
//             "sec-ch-ua-platform": "\"Windows\"",
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-origin",
//             "sec-gpc": "1",
//             "x-csrf-token": "+5Cbz3mb2abNliO9EpNaa9repNyFVtwsglJ6kjI4KEOCAYJaqtsTDbIjNc7cQIeaop3KwN4XAXHsoRMs36swDg==",
//             "x-requested-with": "XMLHttpRequest",
//             "cookie": "__editor_layout=top; cf_clearance=MiwV9IImMMgJPAhWlV9oDu6.Ji8JYf6bkZxO46C9bsg-1712950021-1.0.1.1-9bNSzwm_0GsLJvMtIaF7CG5hWTBlDJkLExt9Ycgp71i0DqelfkMZ4d2An3INckK4NthCdiyT7hbElwAYYzEbQQ; codepen_signup_referrer=https://search.brave.com/; codepen_signup_referrer_date=2024-04-12T20:29:53.782Z; __cf_bm=ZeFpAv6bLibU9gZghk5fuJfmCbozhdx0bH.fELUjNp0-1713096712-1.0.1.1-wHT4iMDSULwihdlKHnXc1iigtwzq3ciieO20gU9AIVVingpa25E0URA7EOuEpsc3GVk24daNChd2m5nouY48nQ; cp_session=tHtmQNbD%2F4qFhvaf--9QCETZtpDrYmxtEqc64uoamUQndA972YEAuNbWEbRoBIr2AOO4l%2BtNxAQOxrOBnPrjob4wvxjZ4%2BxHzIsC416uMvc%2BNaNzb2lbhZRqK1wY%2F%2BRa28GPwBpcn72q1Gp%2BXy8JteYGxd0FaLRoo%2Bv5QwX%2B1p38TW7vPiEYd39uV0Wz36sXqXtJJZHLJdNX8O11y5MqoL6d%2BFeCfRiQ%3D%3D--TxFAekshwjzhLsvbNHVuhw%3D%3D",
//             "Referer": "https://codepen.io/shubniggurath/pen/RdpmGJ",
//             "Referrer-Policy": "strict-origin-when-cross-origin"
//             },
//             "body": "[{\"operationName\":\"ItemTitleQuery\",\"variables\":{\"id\":\"RdpmGJ\",\"itemType\":\"Pen\"},\"query\":\"query ItemTitleQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    itemType\\n    title\\n    owner {\\n      id\\n      title\\n      sessionUser {\\n        id\\n        followsOwner\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  sessionUser {\\n    id\\n    currentContext {\\n      id\\n      title\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"},{\"operationName\":\"ShareDropdownQuery\",\"variables\":{\"id\":\"RdpmGJ\",\"itemType\":\"Pen\"},\"query\":\"query ShareDropdownQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    ... on Pen {\\n      cpid\\n      __typename\\n    }\\n    token\\n    title\\n    private\\n    description {\\n      source {\\n        body\\n        __typename\\n      }\\n      __typename\\n    }\\n    url\\n    sessionUser {\\n      id\\n      ownsItem\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]",    "method": "POST"
//         })


//         [{"data":{"item":{"id":"RdpmGJ","itemType":"Pen","title":"Coalesce 22","owner":{"id":"DjdBLp","title":"Liam Egan","sessionUser":{"id":"982762","followsOwner":false,"__typename":"OwnerSessionUser"},"__typename":"User"},"__typename":"Pen"},"sessionUser":{"id":"VoDkNZ","currentContext":{"id":"VoDkNZ","title":"Captain Anonymous","__typename":"User"},"__typename":"User"}}},{"data":{"item":{"id":"RdpmGJ","cpid":"0169599e-7a00-7c57-916c-d1db25d1b86c","__typename":"Pen","token":null,"title":"Coalesce 22","private":false,"description":{"source":{"body":"GPGPU particles using texture caches for position and velocity.\n\nFor more of these experiments, please see:\nhttps://codepen.io/collection/XEEaEa/","__typename":"Content"},"__typename":"ProcessableContent"},"url":"https://codepen.io/shubniggurath/pen/RdpmGJ","sessionUser":{"id":"33634050","ownsItem":false,"__typename":"ItemSessionUser"}}}}]
