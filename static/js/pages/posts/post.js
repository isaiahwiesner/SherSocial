const postForm = document.getElementById("post-form");
const nextBtn = document.getElementById("next-btn");
const cancelBtn = document.getElementById("cancel-btn");
const fields = {
    title: document.getElementById("title"),
    content: document.getElementById("content"),
    privacy: document.getElementById("privacy")
};
const formError = document.getElementById("form-error");
const privacyInfo = document.getElementById("privacyInfo");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        nextBtn.setAttribute("disabled", "true");
        cancelBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        nextBtn.removeAttribute("disabled");
        cancelBtn.removeAttribute("disabled");
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
        title: fields.title.value,
        content: fields.content.value,
        privacy: fields.privacy.value
    };
    if (!post) {
        const res = await fetch("/shersocial/api/posts/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            window.location = "/shersocial/post?images=1";
        } else {
            const data = await res.json();
            if (data.errors) {
                Object.keys(data.errors).forEach(k => {
                    setError(k, data.errors[k]);
                });
            } else if (data.detail) {
                setFormError(data.detail);
            } else {
                setFormError("Unable to add post.");
            }
            setLoading(false);
        }
    }
    else {
        const res = await fetch(`/shersocial/api/posts/update?postId=${post.postId}&ignoreNoChanges=1`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            window.location = "/shersocial/post?images=1";
        } else {
            const data = await res.json();
            if (data.errors) {
                Object.keys(data.errors).forEach(k => {
                    setError(k, data.errors[k]);
                });
            } else if (data.detail) {
                setFormError(data.detail);
            } else {
                setFormError("Unable to update post.");
            }
            setLoading(false);
        }
    }
};

const handleCancel = async () => {
    setLoading(true);
    if (!post) {
        window.location = "/";
    }
    else {
        const res = await fetch(`/shersocial/api/posts/delete?postId=${post.postId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            window.location = "/";
        }
        else {
            window.location = "/";
            setLoading(false);
        }
    }
}

const renderPrivacyInfo = () => {
    if (fields.privacy.value === "public") {
        privacyInfo.innerText = "Everyone will be able to see this post."
    }
    else if (fields.privacy.value === "members") {
        privacyInfo.innerText = "Only authenticated users will be able to see this post."
    }
    else {
        privacyInfo.innerText = "Only you will be able to see this post."
    }
};

document.addEventListener("DOMContentLoaded", () => {
    postForm.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", handleCancel);
    fields.privacy.addEventListener("change", renderPrivacyInfo);
    renderPrivacyInfo();
});