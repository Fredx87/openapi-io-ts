import { EditIcon } from "@chakra-ui/icons";
import {
  Table,
  Tr,
  Td,
  Tbody,
  Thead,
  Th,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router";
import { Pet } from "../../api/components/schemas/Pet";
import { useOpenApiQuery } from "../../common/react-query";
import { petService } from "./petService";

export interface PetsTableProps {
  status: Pet["status"];
}

export function PetsTable({ status }: PetsTableProps): JSX.Element {
  const { isLoading, error, data } = useOpenApiQuery(
    ["pets", { status }],
    petService.findPetsByStatus({ params: { status } })
  );
  const history = useHistory();

  function editPet(petId: number) {
    history.push(`/pets/${petId}`);
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <div>{error._tag}</div>;
  }

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Id</Th>
          <Th>Name</Th>
          <Th>Actions</Th>
        </Tr>
      </Thead>
      <Tbody>
        {data?.data.map((p) => (
          <Tr key={p.id}>
            <Td>{p.id}</Td>
            <Td>{p.name}</Td>
            <Td>
              {p.id != null && (
                <IconButton
                  icon={<EditIcon />}
                  aria-label="Edit"
                  onClick={() => editPet(p.id!)}
                />
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
