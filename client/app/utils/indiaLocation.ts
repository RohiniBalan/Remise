import { State, City } from "country-state-city";

export const indianStates = State.getStatesOfCountry("IN");

export const getCities = (stateCode: string) => {
  return City.getCitiesOfState("IN", stateCode);
};