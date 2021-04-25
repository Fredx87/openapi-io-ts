import { petServiceBuilder } from "../../api/services/petService";
import { fetchRequestAdapter } from "../../common/fetchRequestAdapter";

export const petService = petServiceBuilder(fetchRequestAdapter);
