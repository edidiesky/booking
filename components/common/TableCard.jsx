
"use client"
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion'
import moment from "moment";
import { MdEdit } from "react-icons/md";
import { BsTrash } from "react-icons/bs";
import DeleteModal from "./DeleteModal";

const TableCard = ({ x, type }) => {
    const [userdeletemodal, setUserDeleteModal] = useState(false)
    const [withdrawalmodal, setWithDrawalModal] = useState(false)

    const handleDeleteClient = () => {
        setUserDeleteModal(true)
    }
  
    if (type === 'customerlist') {
        return (
            <>
                <AnimatePresence>
                    {
                        userdeletemodal && <DeleteModal id={x?._id} modal={userdeletemodal} setModal={setUserDeleteModal} />
                    }
                </AnimatePresence>
                {/* <Delete /> */}
                <tr key={x?._id}>
                    {/* <td>
                        <span className="text-grey fs-12 family1">{x?._id}</span>
                    </td> */}
                    <td>
                        <div className="flex flex-col">
                            <span className="fs-12 text-dark text-bold">{x?.fullname}</span>
                            <span className="fs-12 family1 text-grey">{x?.email}</span>
                        </div>
                    </td>
                    <td>
                        <span className="fs-12 family1 tex  text-grey">{x?.phone}</span>
                    </td>
                    <td>
                        <span className="text-grey fs-12 family1">{x?.country ? x?.country : '-'}</span>
                    </td>
                    <td>
                        <span className="fs-12 family1 text-grey">
                            {x?.isAdmin === true ?
                                <span style={{ fontSize: "1.2rem" }} className="tablespan fs-10 text-bold false"> Admin</span>
                                : <span style={{ fontSize: "1.2rem" }} className="tablespan fs-10 text-bold true"> Client</span>
                            }
                        </span>
                    </td>

                    <td>
                        <span className="text-grey fs-12 family1 text-light">{depositdate}</span>

                    </td>
                    <td>
                        <div className="flex item-center justify-center">
                            <Link to={`/account/admin/dashboard/Manage_Customers/${x?._id}`} className="icons flex hover:shadow-sm hover:bg-[#ddd] items-center justify-center">
                                <MdEdit />
                            </Link>
                            <div onClick={handleDeleteClient} className="icons flex hover:shadow-sm hover:bg-[#ddd] items-center justify-center">
                                <BsTrash />
                            </div>
                        </div>
                    </td>

                </tr>
            </>
        );
    }

    return (
        <>
            {/* <Delete /> */}
            <tr key={x?._id}>
                <td>
                    <span className="fs-12 family1 text-grey">{x?.plan}</span>
                </td>
                <td>
                    <span className="text-grey fs-12 family1">$ {x?.price}</span>
                </td>

                <td>
                    <span className="text-grey fs-12 family1 text-light">Type 1</span>
                </td>
                <td>
                    <span className="text-grey fs-12 family1 text-light">{x?.date}</span>

                </td>
            </tr>
        </>
    );
}


export default TableCard