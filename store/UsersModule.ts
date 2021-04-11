import { User } from '~/types/user'

const initialState = {
  users: [] as User[],
}

export default {
  state: () => initialState,

  mutations: {
    setUser: (state: typeof initialState, payload: User[]) => {
      state.users = payload
    },
  },
}
