import { Heading, VStack } from "@chakra-ui/react";
import React from "react";
import { Pet } from "../../api/components/schemas";
import { PetForm } from "./PetForm";

export function AddPet(): JSX.Element {
  const defaultPet: Pet = {
    photoUrls: [],
    status: "available",
    name: "",
  };

  return (
    <VStack spacing="8" align="stretch">
      <Heading>Add a new pet</Heading>
      <PetForm operation="add" pet={defaultPet} />
    </VStack>
  );
}
