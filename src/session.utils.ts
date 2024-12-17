import { Session } from "./models";

let sessionHolder: { session: Session | null } = {
  session: null,
};

export default sessionHolder;
