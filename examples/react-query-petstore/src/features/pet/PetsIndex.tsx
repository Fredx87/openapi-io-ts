import { Switch, Route, useRouteMatch } from "react-router-dom";
import { AddPet } from "./AddPet";
import { EditPet } from "./EditPet";
import { PetsHome } from "./PetsHome";

export function PetsIndex(): JSX.Element {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path} component={PetsHome} />
      <Route path={`${path}/addPet`} component={AddPet} />
      <Route path={`${path}/:petId`} component={EditPet} />
    </Switch>
  );
}
