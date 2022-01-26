import {
  petServiceBuilder,
  requestFunctionsBuilder,
} from "../../api/operations";
import { fetchRequestAdapter } from "../../common/fetchRequestAdapter";

const requestFunctions = requestFunctionsBuilder(fetchRequestAdapter);
export const petService = petServiceBuilder(requestFunctions);
