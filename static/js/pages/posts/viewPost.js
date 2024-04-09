const likeBtn = document.getElementById("like-btn");
const unlikeBtn = document.getElementById("unlike-btn");

const handleLike = async (e) => {
    if (!user) {
        window.location = `/shersocial/login?redirect=${generalizedPath.slice(1)}`;
    } else {
        const res = await fetch(`/shersocial/api/posts/like-post?postId=${post.postId}`, {
            method: "POST"
        });
        if (res.ok) {
            window.location.reload();
        }
    }

};
const handleUnlike = async (e) => {
    if (!user) {
        window.location = `/shersocial/login?redirect=${generalizedPath.slice(1)}`;
    } else {

    }
    const res = await fetch(`/shersocial/api/posts/unlike-post?postId=${post.postId}`, {
        method: "POST"
    });
    if (res.ok) {
        window.location.reload();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (likeBtn) likeBtn.addEventListener("click", handleLike);
    if (unlikeBtn) unlikeBtn.addEventListener("click", handleUnlike);
});