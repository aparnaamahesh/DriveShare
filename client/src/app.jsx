import React, {
  useEffect,
  useState
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams
} from "react-router-dom";


/* =========================================================
   APP
   ========================================================= */

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  const login = userData => {
    setUser(userData);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <BrowserRouter>

      <nav>
        <Link to="/" className="logo">
          🚗 DriveShare
        </Link>

        <div>

          <Link to="/">
            Home
          </Link>

          {user && (
            <>
              <Link to="/create">
                Create Ride
              </Link>

              <Link to="/myrides">
                My Rides
              </Link>

              <Link to="/requests">
                My Requests
              </Link>

              <button
                onClick={logout}
                className="nav-button"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <Link to="/login">
              Login
            </Link>
          )}

        </div>
      </nav>


      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={
            <Login login={login} />
          }
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/create"
          element={
            <CreateRide user={user} />
          }
        />

        <Route
          path="/ride/:id"
          element={
            <RideDetails user={user} />
          }
        />

        <Route
          path="/myrides"
          element={
            <MyRides user={user} />
          }
        />

        <Route
          path="/requests"
          element={
            <MyRequests user={user} />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


/* =========================================================
   HOME
   ========================================================= */

function Home() {
  const [rides, setRides] = useState([]);
  const [search, setSearch] = useState("");

  const loadRides = () => {
    fetch("/api/rides")
      .then(res => res.json())
      .then(data => {
        setRides(data);
      })
      .catch(err => {
        console.error(
          "Failed to load rides:",
          err
        );
      });
  };

  useEffect(() => {
    loadRides();
  }, []);

  const filtered = rides.filter(ride =>
    `${ride.from} ${ride.to}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main>

      <section className="hero">

        <h1>
          Find Your Ride 🚗
        </h1>

        <p>
          Travel together. Save money.
          Meet your college friends.
        </p>

        <input
          className="search-input"
          placeholder="Search destination..."
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
        />

      </section>


      <h2>
        Available Rides
      </h2>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>
            No rides found.
          </p>
        </div>
      ) : (

        <div className="rides">

          {filtered.map(ride => (

            <div
              className="card"
              key={ride._id}
            >

              <h3>
                {ride.from} → {ride.to}
              </h3>

              <p>
                📅 {ride.date}
              </p>

              <p>
                🕐 {ride.time}
              </p>

              <p>
                💺 {ride.seats} seats
              </p>

              <p>
                👤 {ride.owner}
              </p>

              <Link
                className="btn"
                to={`/ride/${ride._id}`}
              >
                View Ride
              </Link>

            </div>

          ))}

        </div>

      )}

    </main>
  );
}


/* =========================================================
   LOGIN
   ========================================================= */

function Login({ login }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();

    try {

      const res = await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      if (res.ok) {

        login(data);

        navigate("/");

      } else {

        alert(data.message);

      }

    } catch (err) {

      console.error(err);

      alert(
        "Unable to connect to server."
      );
    }
  };

  return (

    <main className="form-page">

      <form onSubmit={submit}>

        <h1>
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e =>
            setEmail(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e =>
            setPassword(e.target.value)
          }
          required
        />

        <button>
          Login
        </button>

        <p>
          Don't have an account?

          <Link to="/signup">
            {" "}Sign Up
          </Link>
        </p>

      </form>

    </main>
  );
}


/* =========================================================
   SIGNUP
   ========================================================= */

function Signup() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const change = e => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value
    });

  };

  const submit = async e => {

    e.preventDefault();

    try {

      const res = await fetch(
        "/api/signup",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(form)
        }
      );

      const data = await res.json();

      alert(data.message);

      if (res.ok) {
        navigate("/login");
      }

    } catch (err) {

      console.error(err);

      alert(
        "Unable to connect to server."
      );
    }
  };

  return (

    <main className="form-page">

      <form onSubmit={submit}>

        <h1>
          Create Account
        </h1>

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={change}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={change}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={change}
          required
        />

        <button>
          Sign Up
        </button>

      </form>

    </main>
  );
}


/* =========================================================
   CREATE RIDE
   ========================================================= */

function CreateRide({ user }) {

  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      from: "",
      to: "",
      date: "",
      time: "",
      seats: 1
    });

  const change = e => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value
    });

  };

  const submit = async e => {

    e.preventDefault();

    if (!user) {

      alert(
        "Please login first"
      );

      return;
    }

    try {

      const res = await fetch(
        "/api/rides",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            ...form,
            owner: user.name
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert(
        "Ride created successfully!"
      );

      navigate("/");

    } catch (err) {

      console.error(err);

      alert(
        "Unable to create ride."
      );
    }
  };

  return (

    <main className="form-page">

      <form onSubmit={submit}>

        <h1>
          Create a Ride 🚗
        </h1>

        <input
          name="from"
          placeholder="From"
          value={form.from}
          onChange={change}
          required
        />

        <input
          name="to"
          placeholder="Destination"
          value={form.to}
          onChange={change}
          required
        />

        <input
          name="date"
          type="date"
          value={form.date}
          onChange={change}
          required
        />

        <input
          name="time"
          type="time"
          value={form.time}
          onChange={change}
          required
        />

        <input
          name="seats"
          type="number"
          min="1"
          placeholder="Available seats"
          value={form.seats}
          onChange={change}
          required
        />

        <button>
          Create Ride
        </button>

      </form>

    </main>
  );
}


/* =========================================================
   RIDE DETAILS
   ========================================================= */

function RideDetails({ user }) {

  const { id } = useParams();

  const [ride, setRide] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetch(`/api/rides/${id}`)
      .then(res => res.json())
      .then(data => {

        setRide(data);
        setLoading(false);

      })
      .catch(err => {

        console.error(err);
        setLoading(false);

      });

  }, [id]);


  const request = async () => {

    if (!user) {

      alert(
        "Please login first"
      );

      return;
    }

    try {

      const res = await fetch(
        `/api/rides/${id}/request`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            user: user.name
          })
        }
      );

      const data = await res.json();

      alert(data.message);

    } catch (err) {

      console.error(err);

      alert(
        "Unable to send request."
      );
    }
  };


  if (loading) {

    return (
      <main>
        <h2>
          Loading...
        </h2>
      </main>
    );
  }


  if (!ride) {

    return (
      <main>
        <h2>
          Ride not found.
        </h2>
      </main>
    );
  }


  return (

    <main>

      <div className="details">

        <h1>
          {ride.from} → {ride.to}
        </h1>

        <p>
          📅 {ride.date}
        </p>

        <p>
          🕐 {ride.time}
        </p>

        <p>
          💺 {ride.seats} seats available
        </p>

        <p>
          👤 Posted by {ride.owner}
        </p>

        {ride.owner !== user?.name &&
          ride.seats > 0 && (

          <button
            onClick={request}
          >
            Request to Join
          </button>

        )}

        {ride.seats <= 0 && (
          <p className="no-seats">
            No seats available.
          </p>
        )}

      </div>

    </main>
  );
}


/* =========================================================
   MY RIDES
   ========================================================= */

function MyRides({ user }) {

  const [rides, setRides] =
    useState([]);

  const [editingRide, setEditingRide] =
    useState(null);

  const [editForm, setEditForm] =
    useState({
      from: "",
      to: "",
      date: "",
      time: "",
      seats: 1
    });


  const loadMyRides = async () => {

    if (!user) return;

    try {

      const res =
        await fetch("/api/rides");

      const data =
        await res.json();

      const mine =
        data.filter(
          ride =>
            ride.owner === user.name
        );

      for (const ride of mine) {

        const requestRes =
          await fetch(
            `/api/rides/${ride._id}/requests`
          );

        ride.requests =
          await requestRes.json();
      }

      setRides(mine);

    } catch (err) {

      console.error(
        "Failed to load rides:",
        err
      );
    }
  };


  useEffect(() => {

    loadMyRides();

  }, [user]);


  if (!user) {

    return (

      <main>

        <h2>
          Please login to view
          your rides.
        </h2>

      </main>
    );
  }


  /* ---------- EDIT ---------- */

  const startEdit = ride => {

    setEditingRide(ride);

    setEditForm({
      from: ride.from,
      to: ride.to,
      date: ride.date,
      time: ride.time,
      seats: ride.seats
    });

  };


  const editChange = e => {

    setEditForm({
      ...editForm,
      [e.target.name]:
        e.target.value
    });

  };


  const saveEdit = async e => {

    e.preventDefault();

    try {

      const res = await fetch(
        `/api/rides/${editingRide._id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            ...editForm,
            seats:
              Number(editForm.seats)
          })
        }
      );

      const data =
        await res.json();

      alert(data.message);

      if (res.ok) {

        setEditingRide(null);

        loadMyRides();
      }

    } catch (err) {

      console.error(err);

      alert(
        "Unable to update ride."
      );
    }
  };


  /* ---------- DELETE ---------- */

  const deleteRide = async rideId => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this ride?"
      );

    if (!confirmed) return;

    try {

      const res = await fetch(
        `/api/rides/${rideId}`,
        {
          method: "DELETE"
        }
      );

      const data =
        await res.json();

      alert(data.message);

      if (res.ok) {
        loadMyRides();
      }

    } catch (err) {

      console.error(err);

      alert(
        "Unable to delete ride."
      );
    }
  };


  /* ---------- ACCEPT ---------- */

  const accept = async (
    rideId,
    name
  ) => {

    try {

      const res = await fetch(
        `/api/rides/${rideId}/accept`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            user: name
          })
        }
      );

      const data =
        await res.json();

      alert(data.message);

      if (res.ok) {
        loadMyRides();
      }

    } catch (err) {

      console.error(err);

      alert(
        "Unable to accept request."
      );
    }
  };


  /* ---------- REJECT ---------- */

  const reject = async (
    rideId,
    name
  ) => {

    try {

      const res = await fetch(
        `/api/rides/${rideId}/reject`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            user: name
          })
        }
      );

      const data =
        await res.json();

      alert(data.message);

      if (res.ok) {
        loadMyRides();
      }

    } catch (err) {

      console.error(err);

      alert(
        "Unable to reject request."
      );
    }
  };


  return (

    <main>

      <h1>
        My Rides
      </h1>


      {rides.length === 0 ? (

        <div className="empty-state">

          <p>
            You haven't created
            any rides yet.
          </p>

          <Link
            className="btn"
            to="/create"
          >
            Create a Ride
          </Link>

        </div>

      ) : (

        rides.map(ride => (

          <div
            className="card my-ride-card"
            key={ride._id}
          >

            <div className="ride-header">

              <div>

                <h3>
                  {ride.from} → {ride.to}
                </h3>

                <p>
                  📅 {ride.date}
                  {" | "}
                  🕐 {ride.time}
                </p>

                <p>
                  💺 {ride.seats}
                  {" "}seats available
                </p>

              </div>


              <div className="ride-actions">

                <button
                  className="edit-btn"
                  onClick={() =>
                    startEdit(ride)
                  }
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteRide(
                      ride._id
                    )
                  }
                >
                  Delete
                </button>

              </div>

            </div>


            <h4>
              Join Requests
            </h4>


            {ride.requests.length === 0 ? (

              <p className="muted">
                No requests yet.
              </p>

            ) : (

              ride.requests.map(
                request => (

                  <div
                    className="request"
                    key={request._id}
                  >

                    <span>

                      <strong>
                        {request.user}
                      </strong>

                      {" — "}

                      <span
                        className={
                          `status ${request.status.toLowerCase()}`
                        }
                      >
                        {request.status}
                      </span>

                    </span>


                    {request.status ===
                      "PENDING" && (

                      <div className="request-actions">

                        <button
                          className="accept-btn"
                          onClick={() =>
                            accept(
                              ride._id,
                              request.user
                            )
                          }
                        >
                          Accept
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() =>
                            reject(
                              ride._id,
                              request.user
                            )
                          }
                        >
                          Reject
                        </button>

                      </div>

                    )}

                  </div>

                )
              )

            )}

          </div>

        ))

      )}


      {/* ---------- EDIT FORM ---------- */}

      {editingRide && (

        <div className="modal-overlay">

          <div className="edit-modal">

            <h2>
              Edit Ride
            </h2>

            <form
              onSubmit={saveEdit}
            >

              <label>
                From
              </label>

              <input
                name="from"
                value={editForm.from}
                onChange={editChange}
                required
              />


              <label>
                Destination
              </label>

              <input
                name="to"
                value={editForm.to}
                onChange={editChange}
                required
              />


              <label>
                Date
              </label>

              <input
                name="date"
                type="date"
                value={editForm.date}
                onChange={editChange}
                required
              />


              <label>
                Time
              </label>

              <input
                name="time"
                type="time"
                value={editForm.time}
                onChange={editChange}
                required
              />


              <label>
                Available Seats
              </label>

              <input
                name="seats"
                type="number"
                min="1"
                value={editForm.seats}
                onChange={editChange}
                required
              />


              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setEditingRide(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}


/* =========================================================
   MY REQUESTS
   ========================================================= */

function MyRequests({ user }) {

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    if (!user) {
      setLoading(false);
      return;
    }

    fetch(
      `/api/requests/${encodeURIComponent(
        user.name
      )}`
    )
      .then(res => res.json())
      .then(data => {

        setRequests(data);
        setLoading(false);

      })
      .catch(err => {

        console.error(err);
        setLoading(false);

      });

  }, [user]);


  if (!user) {

    return (

      <main>

        <h2>
          Please login to view
          your requests.
        </h2>

      </main>
    );
  }


  if (loading) {

    return (

      <main>

        <h2>
          Loading requests...
        </h2>

      </main>
    );
  }


  return (

    <main>

      <h1>
        My Requests
      </h1>


      {requests.length === 0 ? (

        <div className="empty-state">

          <p>
            You haven't requested
            any rides yet.
          </p>

          <Link
            className="btn"
            to="/"
          >
            Find a Ride
          </Link>

        </div>

      ) : (

        <div className="request-list">

          {requests.map(request => (

            <div
              className="card request-card"
              key={request._id}
            >

              {request.ride ? (

                <>

                  <h3>
                    {request.ride.from}
                    {" → "}
                    {request.ride.to}
                  </h3>

                  <p>
                    📅 {request.ride.date}
                  </p>

                  <p>
                    🕐 {request.ride.time}
                  </p>

                  <p>
                    👤 Driver:
                    {" "}
                    {request.ride.owner}
                  </p>

                </>

              ) : (

                <h3>
                  Ride no longer exists
                </h3>

              )}


              <div className="status-row">

                <span>
                  Request Status:
                </span>

                <span
                  className={
                    `status ${request.status.toLowerCase()}`
                  }
                >
                  {request.status}
                </span>

              </div>

            </div>

          ))}

        </div>

      )}

    </main>
  );
}


export default App;
