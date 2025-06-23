import React, { useEffect, useState } from "react";

const App = () => {
  const [data, setData] = useState([{}]);

  useEffect(() => {
    fetch("/members")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        console.log(data);
      });
  }, []);

  return (
    <div>
      <h1>Welcome to the React App</h1>
      {typeof data.members === "undefined" ? (
        <p>Loading...</p>
      ) : (
        data.members.map((member, i) => (
          <p key={i} className="text-lg underline text-blue-500">
            {member}
          </p>
        ))
      )}
    </div>
  );
};

export default App;
