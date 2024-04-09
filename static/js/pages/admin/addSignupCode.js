const addSignupCodeForm = document.getElementById("signup-code-form");
const addSignupCodeBtn = document.getElementById("signup-code-btn");
const fields = {
    signupCode: document.getElementById("signupCode"),
    expiresAt: document.getElementById("expiresAt")
};
const formError = document.getElementById("form-error");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        addSignupCodeBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        addSignupCodeBtn.removeAttribute("disabled");
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
        expiresAt: fields.expiresAt.value ? fields.expiresAt.value : null
    };
    const res = await fetch("/api/admin/add-signup-code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location = "/admin/signup-codes";
    } else {
        const data = await res.json();
        if (data.errors) {
            Object.keys(data.errors).forEach(k => {
                setError(k, data.errors[k]);
            });
        } else if (data.detail) {
            setFormError(data.detail);
        } else {
            setFormError("Unable to add signup code.");
        }
        setLoading(false);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    addSignupCodeForm.addEventListener("submit", handleSubmit);
});