import { petServiceBuilder } from "../../api/operations";
import { fetchRequestAdapter } from "../../common/fetchRequestAdapter";

export const petService = petServiceBuilder(fetchRequestAdapter);
