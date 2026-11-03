import type { OperatorOrganization } from './ql191Organizations';
import { Ql317RoutingStudio } from './Ql317RoutingStudio';

/** QL-298 routing decisions remain canonical. QL-317 upgrades only the safe operator view. */
export function Ql298RoutingStudio({ organization }: { organization: OperatorOrganization }) {
  return <Ql317RoutingStudio organization={organization} />;
}
