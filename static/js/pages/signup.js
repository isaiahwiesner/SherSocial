const signupForm = document.getElementById("signup-form");
const signupBtn = document.getElementById("signup-btn");
const fields = {
    signupCode: document.getElementById("signupCode"),
    username: document.getElementById("username"),
    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName")
};
const formError = document.getElementById("form-error");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        signupBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        signupBtn.removeAttribute("disabled");
    }
};

const setError = (field, message) => {
    if (fields[field]) {
        fields[field].classList.add("is-invalid");
        fields[field].parentElement.getElementsByClassName("form-text")[0].innerText = message;
    };
};

const setFormError = (message) => {
    Object.keys(fields).forEach(k => {
        fields[k].classList.add("is-invalid");
    });
    formError.innerText = message;
};

const resetErrors = () => {
    Object.keys(fields).forEach(k => {
        fields[k].classList.remove("is-invalid");
        fields[k].parentElement.getElementsByClassName("form-text")[0].innerText = "";
    });
    formError.innerText = "";
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrors();
    const body = {
        signupCode: fields.signupCode.value,
        username: fields.username.value,
        firstName: fields.firstName.value,
        lastName: fields.lastName.value
    };
    const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location.reload();
    } else {
        const data = await res.json();
        if (data.errors) {
            Object.keys(data.errors).forEach(k => {
                setError(k, data.errors[k]);
            });
        } else if (data.detail) {
            setFormError(data.detail);
        } else {
            setFormError("Unable to sign up.");
        }
        setLoading(false);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    signupForm.addEventListener("submit", handleSubmit);
});