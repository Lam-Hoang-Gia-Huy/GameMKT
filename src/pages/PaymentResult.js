import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Result, Button, Spin, Space } from "antd";
import { executePaypalPayment } from "../api/apiClient";

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentProcessed = useRef(false);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const queryParams = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      paymentId: query.get("paymentId"),
      payerId: query.get("PayerID"),
      token: query.get("token"),
      projectId: query.get("projectId"),
    };
  }, [location.search]);

  useEffect(() => {
    if (paymentProcessed.current) return;

    const { paymentId, payerId, token } = queryParams;

    if (paymentId && payerId && token) {
      paymentProcessed.current = true;

      executePaypalPayment(paymentId, token, payerId)
        .then((response) => {
          if (response.data.success) {
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMessage(response.data.message || "Payment failed");
          }
        })
        .catch((error) => {
          setStatus("error");
          setErrorMessage(error.response?.data?.message);
        });
    } else {
      setStatus("error");
      setErrorMessage("Missing payment parameters");
    }
  }, [queryParams]);

  const renderContent = () => {
    if (status === "loading") {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <Spin size="large" tip="Processing payment..." />
        </div>
      );
    }

    if (status === "success") {
      return (
        <Result
          status="success"
          title="Payment Successful!"
          subTitle="Thank you for supporting this project."
          extra={renderButtons()}
        />
      );
    }

    return (
      <Result
        status="error"
        title="Payment Failed"
        subTitle={errorMessage}
        extra={renderButtons()}
      />
    );
  };

  const renderButtons = () => {
    const buttons = [
      <Button key="home" type="primary" onClick={() => navigate("/")}>
        Back to Home
      </Button>,
    ];

    if (queryParams.projectId) {
      buttons.push(
        <Button
          key="project"
          onClick={() => navigate(`/project/${queryParams.projectId}`)}
        >
          View Project
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      {renderContent()}
    </div>
  );
};

export default PaymentResult;
