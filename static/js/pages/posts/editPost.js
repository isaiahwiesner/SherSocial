const postForm = document.getElementById("post-form");
const imageForm = document.getElementById("image-form");
const saveNtm = document.getElementById("save-post");
const saveImageBtn = document.getElementById("save-image-btn");
const deletePostBtn = document.getElementById("delete-post-confirm");
const fields = {
    title: document.getElementById("title"),
    content: document.getElementById("content"),
    privacy: document.getElementById("privacy"),
    image: document.getElementById("image-input"),
    imageLink: document.getElementById("image-link-input")
};
const formError = document.getElementById("form-error");
const imageFormError = document.getElementById("image-form-error");
const privacyInfo = document.getElementById("privacyInfo");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        saveNtm.setAttribute("disabled", "true");
        saveImageBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        saveNtm.removeAttribute("disabled");
        saveImageBtn.removeAttribute("disabled");
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
        if ("image,imageLink".split(",").includes(k)) return;
        fields[k].classList.add("is-invalid");
    });
    formError.innerText = message;
};

const setImageFormError = (message) => {
    Object.keys(fields).filter(f => ["image", "imageLink"].includes(f)).forEach(k => {
        
        if ("image,imageLink".split(",").includes(k)) fields[k].classList.add("is-invalid");
    });
    imageFormError.innerText = message;
};

const resetErrors = () => {
    Object.keys(fields).forEach(k => {
        fields[k].classList.remove("is-invalid");
        fields[k].parentElement.getElementsByClassName("form-text")[0].innerText = "";
    });
    formError.innerText = "";
    imageFormError.innerText = "";
};



const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        fields.imageLink.value = "https://";
    }
    handleAnyImage();
};

const handleImageLinkChange = (e) => {
    fields.image.value = null;
    handleAnyImage();
};

const handleAnyImage = () => {
    if ((fields.image.files && fields.image.files[0]) || /https?:\/\/[^\.]*\..+/.test(fields.imageLink.value)) {
        saveImageBtn.removeAttribute("disabled");
    } else {
        saveImageBtn.setAttribute("disabled", true);
    }
};

const convertDataUri = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = (err) => {
            reject(err);
        }
        reader.readAsDataURL(file);
    });
};

const handleSaveImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrors();
    const file = fields.image.files[0];
    const body = {
        image: file ? await convertDataUri(file) : fields.imageLink.value,
        fileType: file ? file.name.split(".").slice(-1) : null
    };
    const res = await fetch(`/shersocial/api/posts/add-image?postId=${post.postId}`, {
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
            if (data.errors.image) {
                setImageFormError(data.errors.image);
            }
        } else if (data.detail) {
            setImageFormError(data.detail);
        } else {
            setImageFormError("Unable to add post image.");
        }
        setLoading(false);
    }
};

const handleRemoveImage = async (e) => {
    const imagePath = e.target.getAttribute("data-image-path");
    setLoading(true);
    const res = await fetch(`/shersocial/api/posts/remove-image?postId=${post.postId}&imagePath=${encodeURIComponent(imagePath)}`, {
        method: "DELETE"
    });
    if (res.ok) {
        window.location.reload();
    } else {
        const data = await res.json();
        if (data.errors) {
            if (data.errors.image) {
                setImageFormError(data.errors.image);
            }
        } else if (data.detail) {
            setImageFormError(data.detail);
        } else {
            setImageFormError("Unable to add post image.");
        }
        setLoading(false);
    }
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
    const res = await fetch(`/shersocial/api/posts/update?postId=${post.postId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location = `/shersocial/posts/${post.postId}`;
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
};

const handleDeletePost = async () => {
    const res = await fetch(`/shersocial/api/posts/delete?postId=${post.postId}`, {
        method: "DELETE"
    });
    if (res.ok) {
        window.location = "/shersocial/profile";
    }
};

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
    imageForm.addEventListener("submit", handleSaveImage);
    fields.privacy.addEventListener("change", renderPrivacyInfo);
    fields.image.addEventListener("change", handleImageChange);
    fields.imageLink.addEventListener("change", handleImageLinkChange);
    fields.imageLink.addEventListener("keyup", handleImageLinkChange);
    deletePostBtn.addEventListener("click", handleDeletePost);
    [...document.querySelectorAll("[data-image-path]")].forEach(e => {
        e.addEventListener("click", handleRemoveImage);
    });
    renderPrivacyInfo();
});