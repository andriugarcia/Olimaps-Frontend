import axios from 'axios'

export const actions = {
  async getUser(_, username) {
    try {
      const { data } = await axios.get(
        `${process.env.SERVER_URL}/users/${username}`
      )
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  },
  async getNotifications(_, page) {
    try {
      const { data } = await axios.get(
        `${process.env.SERVER_URL}/user/notifications/${page}`
      )
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  },
  async getPeople(_) {
    try {
      const { data } = await axios.get(`${process.env.SERVER_URL}/people`)
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  },
  async userAutocomplete(_, searchText) {
    try {
      const { data } = await axios.get(`
        ${process.env.SERVER_URL}/users/find/${searchText}
      `)
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  },
  async findUsers(_, text) {
    try {
      const { data } = await axios.get(
        `${process.env.SERVER_URL}/users/find/${text}`
      )
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  },
  async follow(_, userId) {
    try {
      await axios.post(`${process.env.SERVER_URL}/follow/${userId}`)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  },
  async unfollow(_, userId) {
    try {
      await axios.post(`${process.env.SERVER_URL}/unfollow/${userId}`)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  },
  async updateProfile({ commit }, profile) {
    try {
      await axios.post(`${process.env.SERVER_URL}/user/updateProfile`, profile)
      commit('auth/updateProfile', profile, { root: true })
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  },
  async updateProfilePicture(_, profilePicture) {
    try {
      await axios.post(`${process.env.SERVER_URL}/user/updateProfilePicture`, {
        profilePicture,
      })
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  },
  async readNotifications(_) {
    try {
      await axios.post(`${process.env.SERVER_URL}/user/readNotifications`)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  },
  async sendNotificationToken(_, token) {
    try {
      await axios.post(`${process.env.SERVER_URL}/subscribePushClient`, {
        token
      })
      console.log("TOKEN ENVIADO CON EXITO", token)
      return true
    } catch (err) {
      console.error(err)
      return false
    }

  }
}
