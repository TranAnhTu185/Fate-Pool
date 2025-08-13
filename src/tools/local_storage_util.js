
export default {
  getItemArray(key) {
    let ret = []
    if ('localStorage' in window && window.localStorage !== null) {
      if (localStorage[key] !== undefined && localStorage[key] !== null) {
        ret = JSON.parse(localStorage[key])
      }
    }
    return ret
  },

  getItemObject(key) {
    let ret = {}
    if ('localStorage' in window && window.localStorage !== null) {
      if (localStorage[key] !== undefined && localStorage[key] !== null) {
        ret = JSON.parse(localStorage[key])
      }
    }
    return ret
  },

  setItem(key, value) {
    if (value === undefined || value === null) {
      return false
    }
    if ('localStorage' in window && window.localStorage !== null) {
      localStorage[key] = JSON.stringify(value)
      return true
    }
    return false
  },
}
