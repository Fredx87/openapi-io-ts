import { Heading, Spinner, VStack } from "@chakra-ui/react";
import { useParams } from "react-router";
import { useOpenApiQuery } from "../../common/react-query";
import { PetForm } from "./PetForm";
import { petService } from "./petService";

export function EditPet(): JSX.Element {
  const { petId } = useParams<{ petId: string }>();

  const { isLoading, error, data } = useOpenApiQuery(
    ["pets", { id: petId }],
    petService.getPetById({ petId: +petId })
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <div>{error._tag}</div>;
  }

  return (
    <VStack spacing="8" align="stretch">
      <Heading as="h2">Edit pet {data!.data.name}</Heading>
      <PetForm operation="update" pet={data!.data} />
    </VStack>
  );
}
