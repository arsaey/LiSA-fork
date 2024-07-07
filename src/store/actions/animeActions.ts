import server from '../../utils/axios';
import {
    ANIME_CURRENT_EP_FAIL,
    ANIME_CURRENT_EP_REQUEST,
    ANIME_CURRENT_EP_SUCCESS,
    ANIME_DETAILS_FAIL,
    ANIME_DETAILS_REQUEST,
    ANIME_DETAILS_SUCCESS,
    ANIME_EPISODES_ADD_FAIL,
    ANIME_EPISODES_ADD_REQUEST,
    ANIME_EPISODES_ADD_SUCCESS,
    ANIME_STREAM_DETAILS_FAIL,
    ANIME_STREAM_DETAILS_REQUEST,
    ANIME_STREAM_DETAILS_SUCCESS,
    ANIME_STREAM_EXTERNAL_CLEAR,
    ANIME_STREAM_EXTERNAL_FAIL,
    ANIME_STREAM_EXTERNAL_REQUEST,
    ANIME_STREAM_EXTERNAL_SUCCESS,
} from '../constants/animeConstants';

export const addAnimeDetails = (data) => async (dispatch) => {
    try {
        let ep_details;
        dispatch({ type: ANIME_DETAILS_REQUEST });
        dispatch({ type: ANIME_DETAILS_SUCCESS, payload: data });
        dispatch({ type: ANIME_EPISODES_ADD_REQUEST, payload: data });

        if (data.anime_detail) {
            // dispatch({ type: ANIME_EPISODES_ADD_REQUEST });

            const searchRes = await server.get(data.anime_detail);

            ep_details = await server.get(searchRes.data.response[0].ep_details);
            dispatch({
                type: ANIME_DETAILS_SUCCESS,
                payload: { ...data, ...ep_details.data },
            });
        } else {
            dispatch({ type: ANIME_DETAILS_SUCCESS, payload: data });

            ep_details = await server.get(data.ep_details);
        }

        dispatch(addEpisodesDetails(ep_details.data));
    } catch (error) {
        dispatch({ type: ANIME_DETAILS_FAIL, payload: error });
    }
};

export const addEpisodesDetails = (data) => async (dispatch, getState) => {
    try {
        dispatch({ type: ANIME_EPISODES_ADD_REQUEST });
        const { details } = getState().animeEpisodesDetails;
        let allDetails;
        if (details) {
            allDetails = { ...details, ...data };
        } else {
            allDetails = data;
        }
        dispatch({ type: ANIME_EPISODES_ADD_SUCCESS, payload: allDetails });
    } catch (error) {
        dispatch({ type: ANIME_EPISODES_ADD_FAIL, payload: error });
    }
};
export const addCurrentEp = (data) => async (dispatch) => {
    try {
        dispatch({ type: ANIME_CURRENT_EP_REQUEST });

        dispatch({ type: ANIME_CURRENT_EP_SUCCESS, payload: data });
    } catch (error) {
        dispatch({ type: ANIME_CURRENT_EP_FAIL, payload: error });
    }
};

export const getStreamDetails = (stream_detail) => async (dispatch) => {
    try {
        dispatch({ type: ANIME_STREAM_DETAILS_REQUEST });
        const { data } = await server.get(stream_detail);

        dispatch({ type: ANIME_STREAM_DETAILS_SUCCESS, payload: data });
    } catch (error) {
        dispatch({ type: ANIME_STREAM_DETAILS_FAIL, payload: error });
    }
};

export const playVideoExternal = (payload) => async (dispatch) => {
    try {
        dispatch({ type: ANIME_STREAM_EXTERNAL_REQUEST });
        await server.post(`/stream`, payload, {
            // @ts-ignore
            'Content-Type': 'application/json',
        });

        dispatch({ type: ANIME_STREAM_EXTERNAL_SUCCESS });
    } catch (error) {
        dispatch({
            type: ANIME_STREAM_EXTERNAL_FAIL,
            payload: error.response.data,
        });

        setTimeout(() => {
            dispatch({
                type: ANIME_STREAM_EXTERNAL_CLEAR,
            });
        }, 3000);
        throw new Error(error);
    }
};
