const passwordForm = document.getElementById("password-form");
const passwordBtn = document.getElementById("password-btn");
const logoutBtn = document.getElementById("logout");
const fields = {
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword")
};
const formError = document.getElementById("form-error");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        passwordBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        passwordBtn.removeAttribute("disabled");
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
        password: fields.password.value,
        confirmPassword: fields.confirmPassword.value
    };
    const res = await fetch("/shersocial/api/update-password", {
        method: "PUT",
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
            setFormError("Unable to log in.");
        }
        setLoading(false);
        fields.password.focus();
    }
};

const handleLogout = async () => {
    const res = await fetch("/shersocial/api/logout", {
        method: "POST"
    });
    if (res.ok) {
        window.location.reload();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    passwordForm.addEventListener("submit", handleSubmit);
    logoutBtn.addEventListener("click", handleLogout);
});