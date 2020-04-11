import axios from "axios";
import _ from "lodash";

import actionTypes from "../types";
import { normalizeCards } from "./cards.utils";

export const addCard = (title, listHome, boardHome) => async dispatch => {
  const tempId = _.uniqueId("zzzzz");

  const newCard = {
    _id: "",
    tempId,
    title,
    listHome,
    boardHome,
    description: "",
    checklist: [],
    archived: false
  };

  // Send new card to reducers
  dispatch({
    type: actionTypes.ADD_CARD,
    payload: newCard
  });

  try {
    const cardFromDatabase = await axios.post(`/api/v1/cards`, {
      title,
      listHome,
      boardHome
    });

    dispatch({
      type: actionTypes.ADD_CARD_SUCCESS,
      payload: { newId: cardFromDatabase.data.data._id, tempId }
    });
  } catch (error) {
    dispatch({
      type: actionTypes.ADD_CARD_FAILURE,
      error
    });
  }
};

export const moveCard = (cardId, newListHome) => async dispatch => {
  // Make PATCH request
  await axios.patch(`/api/v1/cards/${cardId}`, { listHome: newListHome });

  // Send arguments to reducers
  dispatch({
    type: actionTypes.MOVE_CARD,
    payload: {
      cardId,
      newListHome
    }
  });
};

export const copyCard = (sourceCardId, newListHome) => async dispatch => {
  // GET card to be copied (source card)
  let card = (await axios.get(`/api/v1/cards/${sourceCardId}`)).data.data;

  // Change the list home of that card
  card.listHome = newListHome;

  // Destructure fields for POST request (all but original document ID)
  let { description, archived, title, boardHome, listHome, checklist } = card;

  // If the source card has a checklist, copy all values into new array so Mongo can create new IDs
  if (checklist) {
    checklist = checklist.map(({ checked, label }) => ({ checked, label }));
  }

  // Create card in database
  let newCard = await axios.post(`/api/v1/cards`, {
    description,
    archived,
    title,
    boardHome,
    listHome,
    checklist
  });

  // Send new card to reducers
  dispatch({
    type: actionTypes.ADD_CARD,
    payload: newCard.data.data
  });
};

export const archiveCard = cardId => async dispatch => {
  // Make PATCH request
  await axios.patch(`/api/v1/cards/${cardId}`, { archived: true });

  // Send card ID to reducers
  dispatch({
    type: actionTypes.ARCHIVE_CARD,
    payload: cardId
  });
};

export const restoreCard = cardId => async dispatch => {
  // Make PATCH request
  await axios.patch(`/api/v1/cards/${cardId}`, {
    archived: false
  });

  // Send card ID to reducers
  dispatch({
    type: actionTypes.RESTORE_CARD,
    payload: cardId
  });
};

export const updateCardDescription = (
  cardId,
  descriptionInput
) => async dispatch => {
  // Make PATCH request
  await axios.patch(`/api/v1/cards/${cardId}`, {
    description: descriptionInput
  });

  // Send arguments to reducers
  dispatch({
    type: actionTypes.UPDATE_CARD_DESCRIPTION,
    payload: {
      cardId,
      descriptionInput
    }
  });
};

export const addChecklistItem = (cardId, label) => async dispatch => {
  // Push new checklist item to card
  const updatedCard = await axios.patch(`/api/v1/cards/${cardId}`, {
    $push: { checklist: { label } }
  });

  // Send new checklist to reducers
  const { checklist } = updatedCard.data.data;

  dispatch({
    type: actionTypes.UPDATE_CHECKLIST,
    payload: {
      cardId,
      checklist
    }
  });
};

export const checkOrUncheckChecklistItem = (
  cardId,
  checklistItemId,
  checked
) => async dispatch => {
  // Set checked field to false if currently true, and vice-versa
  const updateBody = { $set: { "checklist.$.checked": !checked } };

  // Update card and get updated checklist from it
  const updatedCard = await axios.patch(
    `/api/v1/cards/${cardId}/checklist/${checklistItemId}`,
    updateBody
  );
  const { checklist } = updatedCard.data.data;

  // Send updated checklist to reducers
  dispatch({
    type: actionTypes.UPDATE_CHECKLIST,
    payload: {
      cardId,
      checklist
    }
  });
};

export const deleteChecklistItem = (
  cardId,
  checklistItemId
) => async dispatch => {
  // Make DELETE request (internally a findByIdAndUpdate method on the Card model)
  const updatedCard = await axios.delete(
    `/api/v1/cards/${cardId}/checklist/${checklistItemId}`
  );

  // Send updated checklist to reducers
  const { checklist } = updatedCard.data.data;

  dispatch({
    type: actionTypes.UPDATE_CHECKLIST,
    payload: {
      cardId,
      checklist
    }
  });
};
