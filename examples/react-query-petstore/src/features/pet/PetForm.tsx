import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { Pet } from "../../api/components/schemas";
import { useOpenApiMutation } from "../../common/react-query";
import { petService } from "./petService";

export interface PetFormProps {
  pet: Pet;
  operation: "add" | "update";
}

export function PetForm({ pet, operation }: PetFormProps): JSX.Element {
  const { register, handleSubmit } = useForm<Pet>({
    defaultValues: pet,
  });

  const history = useHistory();

  const mutation = useOpenApiMutation(
    (pet: Pet) =>
      operation === "update"
        ? petService.updatePet(pet)
        : petService.addPet(pet),
    {
      onSuccess: () => {
        history.push("/pets");
      },
    }
  );

  function onSubmit(pet: Pet) {
    mutation.mutate(pet);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing="4" align="stretch">
        {operation === "add" && (
          <FormControl id="id">
            <FormLabel>Id</FormLabel>
            <Input type="number" {...register("id")} required />
          </FormControl>
        )}
        <FormControl id="name">
          <FormLabel>Name</FormLabel>
          <Input {...register("name")} required />
        </FormControl>
        <Box textAlign="right">
          <Button
            type="button"
            variant="outline"
            mr="2"
            onClick={() => {
              history.go(-1);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" colorScheme="teal">
            Save
          </Button>
        </Box>
      </VStack>
    </form>
  );
}
