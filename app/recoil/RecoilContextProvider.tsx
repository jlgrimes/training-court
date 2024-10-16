"use client";
import React from "react";
import { RecoilRoot } from "recoil";
const RecoilContextProvider = ({ children }: any) => {
  return <RecoilRoot>{children}</RecoilRoot>;
};
export default RecoilContextProvider;