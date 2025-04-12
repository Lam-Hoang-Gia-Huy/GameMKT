import React, { useState, useRef } from "react";
import Footer from "../Layout/registerlayout/footer/Footer";
import ReCAPTCHA from "react-google-recaptcha";
import axios from "axios";

const Register = () => {
  const [captchaValue, setCaptchaValue] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Ngăn spam nút

  const recaptchaRef = useRef(null);
  const sitekey =
    process.env.REACT_APP_RECAPTCHA_SITE_KEY || "your_default_site_key_here";

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // ✅ Chặn spam nhiều lần
    setIsSubmitting(true); // ✅ Ngăn người dùng bấm nhiều lần

    setSuccessMsg("");
    setErrorList([]);

    if (password !== confirmPassword) {
      setErrorList(["Mật khẩu và xác nhận mật khẩu không khớp."]);
      setIsSubmitting(false); // ✅ Mở lại nút nếu có lỗi
      return;
    }

    try {
      const response = await axios.post(
        "https://marvelous-gentleness-production.up.railway.app/api/Authentication/register",
        {
          email,
          password,
          "confirm-password": confirmPassword,
          fullname,
        }
      );

      setErrorList([]);
      setSuccessMsg(response.data?.message || "Register successfully!");

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullname("");
      setCaptchaValue(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    } catch (err) {
      const data = err.response?.data;
      const errors = data?.errors;

      if (errors) {
        const newErrorList = [];
        for (const key in errors) {
          newErrorList.push(...errors[key]);
        }
        setErrorList(newErrorList);
      } else if (data?.message) {
        setErrorList([data.message]);
      } else {
        setErrorList(["Register unsuccessfully."]);
      }
    } finally {
      setIsSubmitting(false); // ✅ Mở lại nút sau khi API phản hồi
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-steam items-center">
      <div className="h-auto max-w-7xl flex flex-col items-start mr-0 lg:mr-[500px] pl-3 lg:pl-0">
        <div className="my-10">
          <h1 className="text-5xl text-slate-200">
            Create your own account here
          </h1>
        </div>

        <form onSubmit={handleRegister}>
          <div className="my-2 space-y-3">
            <InputField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputField
              id="confirm-password"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <InputField
              id="fullname"
              label="Fullname"
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>

          <div className="flex justify-center mt-2 mb-4">
            <ReCAPTCHA
              sitekey={sitekey}
              onChange={handleCaptchaChange}
              ref={recaptchaRef}
            />
          </div>

          {/* ✅ Nút Tiếp tục: Chỉ bấm được một lần, hiển thị loading */}
          <button
            type="submit"
            className={`mt-2 bg-blue-500 text-white px-4 py-2 rounded w-[200px] 
              ${
                !captchaValue || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            disabled={!captchaValue || isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Next"}
          </button>
        </form>

        {errorList.length > 0 && (
          <div className="text-red-500 my-10 w-[300px] lg:w-[400px] break-words space-y-1">
            {errorList.map((err, idx) => (
              <p key={idx}>• {err}</p>
            ))}
          </div>
        )}

        {successMsg && (
          <div className="text-green-500 my-6 w-[300px] lg:w-[400px] text-center">
            <p>{successMsg}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

// 🔄 Tái sử dụng component InputField
const InputField = ({ id, label, type, value, onChange }) => (
  <div className="flex flex-col relative hover:scale-105 transition-transform duration-300">
    <div className="bg-transparent md:bg-steam mb-5">
      <div className="relative bg-inherit">
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className="peer bg-transparent h-10 w-[250px] lg:w-[300px] rounded-lg text-slate-400 placeholder-transparent ring-2 
                     px-2 ring-gray-500 focus:ring-sky-600 focus:outline-none focus:border-rose-600"
          placeholder=""
        />
        <label
          htmlFor={id}
          className="absolute cursor-text left-0 -top-6 md:-top-3 text-sm 
                     text-blue_steam bg-inherit mx-1 px-1 peer-placeholder-shown:text-base 
                     peer-placeholder-shown:text-slate-200 md:peer-placeholder-shown:text-blue_steam 
                     peer-placeholder-shown:top-2 peer-focus:-top-8 md:peer-focus:-top-3
                     peer-focus:text-blue_steam peer-focus:text-sm transition-all font-medium"
        >
          {label}
        </label>
      </div>
    </div>
  </div>
);

export default Register;
