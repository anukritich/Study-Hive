import React from "react";
import { styles } from "../style";
import AnimatedCanvas from "./AnimatedCanvas"; // ✅ Import the new AnimatedCanvas
import { Link } from "react-router-dom";
import herobg from "../assets/stars-bg2.jpg";

const Hero = () => {
  const username = "User";

  return (
    <section className="relative w-full h-screen flex justify-center items-center overflow-hidden">
      {/* Background Image with 30% opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${herobg})` }}
      ></div>

      {/* Content Wrapper */}
      <div className="relative z-10 w-full px-10 lg:px-20 max-w-7xl flex flex-col justify-center items-center gap-10">
        {/* 3D Model Section */}
        <div className="h-[330px] w-[700px] cursor-grab flex justify-center">
          <AnimatedCanvas /> {/* ✅ Uses the animated book model */}
        </div>

        {/* Text & Button Section */}
        <div className="text-center">
          <h1 className="font-black text-white text-[65px] leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-br from-[#ffffff] to-[#3a6fc9] bg-clip-text text-transparent">
              Study Hive
            </span>
          </h1>

          {username === "User" && (
            <div className="relative top-[30px]">
              <Link to="/login">
                <button className="bg-[#4d84e2] text-black w-[180px] h-[50px] rounded-[9px] font-bold text-xl hover:bg-[#699cff] transition duration-200 hover:cursor-pointer">
                  Let's Begin
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;