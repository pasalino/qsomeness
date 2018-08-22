const getKV = (param) => {
  const key = Object.keys(param)[0];
  const val = param[key];
  return { key, val };
}

const qSomeness = {
  removeDuplication: (url) => {
    const [urlPart, qs] = url.split('?');
    return typeof qs !== 'undefined' ?
      `${urlPart}?${qs.split('&').filter((val, i, self) => self.indexOf(val) === i).join('&')}` :
      urlPart;
  },

  setParam: (key, val) => !Array.isArray(val) ?
    `${encodeURIComponent(key)}=${encodeURIComponent(val)}` :
    val.map((v) => qSomeness.setParam(key, v)).join('&'),

  add: (url, param) => {
    const check = url.split('?').length > 1;
    const { key, val } = getKV(param);
    const newParam = qSomeness.setParam(key, val);
    return check ?
      `${url}&${newParam}` :
      `${url}?${newParam}`;
  },

  addMultiple: (url, params) => {
    const check = url.split('?').length > 1;
    const newParams = params.map((param) => {
      const { key, val } = getKV(param);
      return qSomeness.setParam(key, val);
    }).join('&');
    return check ?
      `${url}&${newParams}` :
      `${url}?${newParams}`;
  },

  update: (url, param) => {
    const [urlPart, qs] = url.split('?');
    const { key, val } = getKV(param);
    if (typeof qs !== 'undefined') {
      let found = false;
      const editedQs = qs.split('&').map((qsEl) => {
        if (qsEl.split('=')[0] === key) {
          found = true;
          return qSomeness.setParam(key, val);
        }
        return qsEl;
      });
      const newQs = found ? editedQs : [...editedQs, qSomeness.setParam(key, val)];
      return `${urlPart}?${newQs.join('&')}`;
    }
    return `${url}?${qSomeness.setParam(key, val)}`;
  },

  updateMultiple: (url, params) => params.reduce((newUrl, currParam) => qSomeness.update(newUrl, currParam), url),

  remove: (url, key) => {
    const [urlPart, qs] = url.split('?');
    if (typeof qs !== 'undefined') {
      const newQs = qs.split('&').filter((qsEl) => qsEl.split('=')[0] !== key);
      return newQs.length === 0 ? urlPart : `${urlPart}?${newQs.join('&')}`;
    }
    return url;
  },

  removeMultiple: (url, keys) => keys.reduce((newUrl, key) => qSomeness.remove(newUrl, key), url),

  get: (url, key) => {
    const [, qs] = url.split('?');
    if (typeof qs === 'undefined') {
      return '';
    }
    const foundParams = qs.split('&').filter((qsEl) => qsEl.split('=')[0] === key);
    if (foundParams.length === 0) {
      return '';
    }
    return foundParams.length === 1 ?
      decodeURIComponent(foundParams[0].split('=')[1]) :
      foundParams.map((p) => decodeURIComponent(p.split('=')[1]));
  },

  getQuerystringObject: (url) => {
    const [, qs] = url.split('?');
    if (typeof qs === 'undefined') {
      return {};
    }
    return qs.split('&').reduce((obj, param) => {
        const [key, val] = param.split('=');
        if (Array.isArray(obj[key])) {
          obj[key] = [...obj[key], decodeURIComponent(val)];
        } else {
          obj[key] = obj[key] ? [obj[key], decodeURIComponent(val)] : decodeURIComponent(val);
        }
        return obj;
      }, {});
  }
};

const TO_REMOVE_DUPLICATION = ['add', 'addMultiple', 'update', 'updateMultiple', 'remove'];

module.exports = Object.keys(qSomeness).reduce((obj, method) => {
  obj[method] = TO_REMOVE_DUPLICATION.indexOf(method) > -1 ?
    (...args) => qSomeness.removeDuplication(qSomeness[method].apply(qSomeness, args)) :
    qSomeness[method];
  return obj;
}, {});
