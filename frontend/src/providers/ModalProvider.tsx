import { useSelector, useDispatch }  from "react-redux";
import { selectModal, closeModal }   from "@/redux/slices/modalSlice";
import type { ModalName }            from "@/types/ui";

// Import modals as they are built — add entries here per stage
// import CreatePropertyModal  from "@/screens/dashboard/Properties/CreatePropertyModal";
// import CreateRoomTypeModal  from "@/screens/dashboard/Properties/CreateRoomTypeModal";
// import CancelBookingModal   from "@/screens/guest/MyBookings/CancelBookingModal";
// import AssignRoleModal      from "@/screens/dashboard/Roles/AssignRoleModal";

function useModal(name: ModalName) {
  const dispatch = useDispatch();
  const state    = useSelector(selectModal(name));
  const close    = () => dispatch(closeModal(name));
  return { ...state, close };
}

export default function ModalProvider() {
  // Uncomment each modal as its screen is built in later stages.
  // const createProperty = useModal("createProperty");
  // const cancelBooking  = useModal("cancelBooking");
  // const assignRole     = useModal("assignRole");

  return (
    <>
      {/* modals rendered here once screens are complete */}
    </>
  );
}