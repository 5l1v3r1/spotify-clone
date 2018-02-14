import * as types from '../actions/action-types';
import skipUnavailableTracks from '../utils/skipUnavailableTracks';

const setToken = token => ({
  type: types.TOKEN_SET,
  token,
});

const setGenres = genres => ({
  type: types.GENRES_SET,
  genres,
});

const setCategoryPlaylist = categoryPlaylist => ({
  type: types.CATEGORY_PLAYLIST_SET,
  categoryPlaylist,
});

const fetchWithToken = (url, token) => {
  return fetch(url, {
    headers: new Headers({
      Authorization: 'Bearer ' + token.access_token,
    }),
  }).then(res => res.json());
};

export const clearCategoryPlaylist = () => ({
  type: types.CATEGORY_PLAYLIST_CLEAR,
});

export const fetchToken = () => dispatch => {
  return fetch('https://spotify.jenovs.com')
    .then(res => res.json())
    .then(token => dispatch(setToken(token)))
    .catch(err => console.log('Error fetching Token', err)); // TODO add error handling
};

export const fetchFeatured = () => (dispatch, getState) => {
  const { token } = getState();
  const url = 'https://api.spotify.com/v1/browse/featured-playlists';

  return fetchWithToken(url, token)
    .then(data => {
      if (data.error) throw data.error.message;
      dispatch({
        type: types.FEATURED_SET,
        featured: data,
      });
    })
    .catch(err => console.log('Error fetching Featured', err)); // TODO add error handling
};

export const fetchGenres = () => (dispatch, getState) => {
  const { token } = getState();
  const url = 'https://api.spotify.com/v1/browse/categories?limit=50';

  fetchWithToken(url, token)
    .then(data => {
      if (data.error) throw data.error.message;
      dispatch(setGenres(data.categories.items));
    })
    .catch(err => console.error(err));
};

export const fetchCategoryPlaylist = category_id => (dispatch, getState) => {
  const { token } = getState();
  const url = `https://api.spotify.com/v1/browse/categories/${category_id}/playlists?limit=50`;

  fetchWithToken(url, token)
    .then(data => {
      if (data.error) throw data.error.message;
      dispatch(setCategoryPlaylist(data.playlists.items));
    })
    .catch(err => console.error(err));
};

const setNewReleases = albums => ({
  type: types.NEW_RELEASES_SET,
  albums,
});

export const fetchNewReleases = () => (dispatch, getState) => {
  const { token } = getState();
  const url = 'https://api.spotify.com/v1/browse/new-releases?limit=50';

  fetchWithToken(url, token).then(albums => dispatch(setNewReleases(albums)));
};

const normalizeTracks = (trackArray, images) => {
  return trackArray.map((track, i) => {
    return { track: { ...track, album: { images: [...images] } } };
  });
};

export const fetchAlbum = href => (dispatch, getState) => {
  const { token, playlist } = getState();

  // Check if playlist already fetched
  if (href === playlist.href) return;

  return fetchWithToken(href, token)
    .then(data => {
      dispatch({
        type: types.ALBUM_UPDATE,
        playlist: {
          href,
          imageUrl: data.images[0].url,
          name: data.name,
          artists: data.artists,
          date: data.release_date,
        },
        tracks: normalizeTracks(data.tracks.items, data.images),
      });
    })
    .catch(err => console.error('Error fetching Album:', err));
};

export const fetchPlaylist = href => (dispatch, getState) => {
  const { token } = getState();

  return fetchWithToken(href, token)
    .then(data => {
      if (data.error) throw data.error.message;
      dispatch({
        type: types.PLAYLIST_SET,
        playlist: {
          href,
          imageUrl: data.images[0].url,
          name: data.name,
          owner: data.owner.display_name,
          description: data.description,
          type: data.type,
        },
        tracks: data.tracks.items,
      });
    })
    .catch(err => console.log('Error fetching Playlist', err));
};

export const fetchPlaylistView = href => (dispatch, getState) => {
  const { token, playlist } = getState();

  if (href === playlist.href) {
    dispatch({
      type: types.COPY_TO_VIEW,
    });
  } else {
    fetchWithToken(href, token).then(data => {
      const tracks =
        data.type === 'album'
          ? normalizeTracks(data.tracks.items, data.images)
          : data.tracks.items;
      dispatch({
        type: types.SET_PLAYLIST_VIEW,
        playlist: {
          href,
          imageUrl: data.images[0].url,
          name: data.name,
          owner: data.owner && data.owner.display_name,
          description: data.description,
          type: data.type,
        },
        tracks,
      });
    });
  }
};

const play = (trackId, dispatch) => {
  if (!~trackId) {
    setTimeout(
      () =>
        dispatch({
          type: types.RESET_NO_PREVIEW,
        }),
      2000
    );

    return { type: types.STOP_PLAY };
  }
  return {
    type: types.PLAY_TRACK,
    trackId,
  };
};

// Fetches playlist if not in memory and starts it from first available track
export const startPlaylist = ({ href }) => async (dispatch, getState) => {
  const { playlist } = getState();

  if (href !== playlist.href) {
    await fetchPlaylist(href)(dispatch, getState);
  }

  const { tracklist } = getState();
  const songInd = skipUnavailableTracks(tracklist, 0);
  dispatch(play(songInd, dispatch));
};

// Fetches album if not in memory and starts it from first available track
export const startAlbum = ({ href }) => async (dispatch, getState) => {
  const { playlist } = getState();

  if (href !== playlist.href) {
    await fetchAlbum(href)(dispatch, getState);
  }

  const { tracklist } = getState();
  const songInd = skipUnavailableTracks(tracklist, 0);

  dispatch(play(songInd, dispatch));
};

export const clearPlaylistView = () => (dispatch, getState) => {
  dispatch({
    type: types.CLEAR_PLAYLIST_VIEW,
  });
};

export const unpause = () => (dispatch, getState) => {
  dispatch({
    type: types.UNPAUSE,
  });
};

export const startPlayFromTracklist = (track = 0) => (dispatch, getState) => {
  dispatch({
    type: types.COPY_FROM_VIEW,
  });
  const { tracklist } = getState();
  const songInd = skipUnavailableTracks(tracklist, track);

  dispatch(play(songInd, dispatch));
};
