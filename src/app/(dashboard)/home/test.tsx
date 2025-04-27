'use client';

import { useEffect, useState } from "react";

import { getCompanies } from "@/contexts/api";

const Test = () => {
    const [counter, setCounter] = useState(30);

    useEffect(() => {
        const getData = async () => {
            const res = await getCompanies();

            console.log(res);
        };

        getData();
    }, []);


    const handleClick = async () => {
        setCounter(30);
        const res = await getCompanies();

        console.log(res);
    }

    useEffect(() => {
        if (counter > 0) {
            const timer = setInterval(() => {
                setCounter((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [counter]);

    return (
        <div>
            <h1>Counter: {counter}s</h1>
            <h1>Tes</h1>
            <button onClick={() => handleClick()}>Call</button>
        </div>
    );
};

export default Test;
