const addUserForm = document.getElementById("user-form");
const addUserBtn = document.getElementById("user-btn");
const fields = {
    username: document.getElementById("username"),
    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName"),
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
        addUserBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        addUserBtn.removeAttribute("disabled");
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
        username: fields.username.value,
        firstName: fields.firstName.value,
        lastName: fields.lastName.value,
        password: fields.password.value,
        confirmPassword: fields.confirmPassword.value
    };
    const res = await fetch("/shersocial/api/admin/add-user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location = "/shersocial/admin/users";
    } else {
        const data = await res.json();
        if (data.errors) {
            Object.keys(data.errors).forEach(k => {
                setError(k, data.errors[k]);
            });
        } else if (data.detail) {
            setFormError(data.detail);
        } else {
            setFormError("Unable to add user.");
        }
        setLoading(false);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    addUserForm.addEventListener("submit", handleSubmit);
});