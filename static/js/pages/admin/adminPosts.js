const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchResultsPerPage = document.getElementById("search-results-perpage");
const searchResultsOrderBy = document.getElementById("search-results-orderby");
const searchBtn = document.getElementById("search-btn");
const searchResults = document.getElementById("search-results");
const searchFooter = document.getElementById("search-footer")
const deletePostBtn = document.getElementById("delete-post-confirm");
const cancelDeletePostBtn = document.getElementById("cancel-delete-post-confirm");
var currentPosts = [];
var currentResults = {};
var currentDeletePost = null;
var queryParams = {};
const handleSearch = async (e) => {
    if (e) {
        e.preventDefault();
        delete queryParams.page;
    }
    queryParams.q = searchInput.value === "" ? null : searchInput.value;
    queryParams.resultsPerPage = parseInt(searchResultsPerPage.value);
    queryParams.orderBy = searchResultsOrderBy.value;
    if (!queryParams.q) delete queryParams.q;
    renderCurrentPosts();
};
const clearSearch = async (e) => {
    searchInput.value = "";
    delete queryParams.q;
    queryParams.page = 1;
    renderCurrentPosts();
};
const changePage = (page) => {
    return () => {
        queryParams.page = page;
        renderCurrentPosts();
    };
};
const renderCurrentPosts = async () => {
    var url = `/shersocial/api/admin/posts?`;
    if (!queryParams.q) delete queryParams.q;
    url += Object.keys(queryParams).map(k => `${k}=${encodeURIComponent(queryParams[k])}`).join("&");
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + Object.keys(queryParams).map(k => `${k}=${encodeURIComponent(queryParams[k])}`).join("&");;
        window.history.pushState({
            path: newurl
        }, '', newurl);
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.posts) {
        currentPosts = data.posts;
        currentResults = {
            page: data.page,
            resultsPerPage: data.resultsPerPage,
            pages: data.pages,
            orderBy: data.orderBy
        }
    } else {
        currentPosts = [];
        currentResults = {
            resultsPerPage: queryParams.resultsPerPage,
            page: 1
        };
    }
    var innerHTML = "";
    currentPosts.forEach(p => {
        innerHTML += `<tr>
          <td class="align-middle">${p.title}</td>
          <td class="align-middle"><a href="/shersocial/@${p.userUsername}" target="_blank">${p.userFullName} (@${p.userUsername}) &nbsp;<i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
          <td class="align-middle">${p.timeSince}</td>
          <td class="align-middle">
            <button title="Delete post" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#deletePostModal" data-postid="${p.postId}">
              <i class="fa-solid fa-trash" data-postid="${p.postId}"></i>
            </button>
            <a title="View post" role="button" class="btn btn-info" href="/shersocial/posts/${p.postId}" target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
          </td>
        </tr>`;
    });
    searchResults.innerHTML = innerHTML;
    [...searchResults.querySelectorAll(`button[data-postid]`)].forEach(btn => {
        btn.addEventListener("click", handleDeleteOpen);
    });
    var footerHTML = "";
    if (queryParams.q) {
        footerHTML += `<tr>
          <td colspan="4" class="text-center">
            <a href id="clear-search" role="button">Clear Search</a>
          </td>
        </tr>`;
    }
    footerHTML += `<tr>
        <td colspan="4">
          <section class="d-flex w-100 justify-content-center">
            <a data-page="${(+currentResults.page - +1)}" role="button" class="me-3 ${currentResults.page > 1 ? '' : 'disabled'}">Previous</a>
            Page ${currentResults.page} of ${currentResults.pages}
            <a data-page="${(+currentResults.page + +1)}" role="button" class="ms-3 ${currentResults.page < currentResults.pages ? '' : 'disabled'}">Next</a>
          </section>
        </td>
      </tr>`;
    searchFooter.innerHTML = footerHTML;
    [...searchFooter.querySelectorAll("[data-page]:not(.disabled)")].forEach(l => {
        l.addEventListener("click", changePage(parseInt(l.getAttribute("data-page"))));
    });
    if (queryParams.q) {
        document.getElementById("clear-search").addEventListener("click", clearSearch);
    }
    document.getElementById("perpage-text").innerText = `${currentResults.resultsPerPage} results per page`;
};
const handleDeleteOpen = (e) => {
    const postId = e.target.getAttribute("data-postid");
    currentDeletePost = currentPosts.filter(u => u.postId === postId)[0];
    document.getElementById("delete-modal-title").innerText = currentDeletePost.title;
};
const handleDeletePost = async () => {
    const res = await fetch(`/shersocial/api/posts/delete?postId=${currentDeletePost.postId}`, {
        method: "DELETE"
    });
    if (res.ok) {
        currentDeletePost = null;
        renderCurrentPosts();
    }
};
const handleCancelDeletePost = () => {
    currentDeletePost = null;
};
document.addEventListener("DOMContentLoaded", () => {
    queryParams = {
        q: window.location.search.match(/[\?&]q=([^&]*)/) ? window.location.search.match(/[\?&]q=([^&]*)/)[1] : null,
        page: window.location.search.match(/[\?&]page=([^&]*)/) ? parseInt(window.location.search.match(/[\?&]page=([^&]*)/)[1]) : 1,
        resultsPerPage: window.location.search.match(/[\?&]resultsPerPage=([^&]*)/) ? parseInt(window.location.search.match(/[\?&]resultsPerPage=([^&]*)/)[1]) : 10,
        orderBy: window.location.search.match(/[\?&]orderBy=([^&]*)/) ? decodeURIComponent(window.location.search.match(/[\?&]orderBy=([^&]*)/)[1]) : "createdAt DESC"
    };
    var perPageHTML = "";
    perPageHTML += `
      <option value="5" ${queryParams.resultsPerPage === 5 ? 'selected' : ''}>5</option>
      <option value="10" ${queryParams.resultsPerPage === 10 ? 'selected' : ''}>10</option>
      <option value="25" ${queryParams.resultsPerPage === 25 ? 'selected' : ''}>25</option>
      <option value="50" ${queryParams.resultsPerPage === 50 ? 'selected' : ''}>50</option>`;
    if (![5, 10, 25, 50].includes(queryParams.resultsPerPage) && queryParams.resultsPerPage > 0) {
        perPageHTML += `<option value="${queryParams.resultsPerPage}" selected>${queryParams.resultsPerPage}</option>`
    }
    searchResultsPerPage.innerHTML = perPageHTML;
    var orderByHTML = "";
    orderByHTML += `
      <option value="createdAt DESC" ${queryParams.orderBy ==="createdAt DESC" ? 'selected' : ''}>Newest</option>
      <option value="createdAt" ${queryParams.orderBy === "createdAt" ? 'selected' : ''}>Oldest</option>
      <option value="likes DESC, createdAt DESC" ${queryParams.orderBy ==="likes DESC, createdAt DESC" ? 'selected' : ''}>Most Popular</option>
      <option value="likes, createdAt DESC" ${queryParams.orderBy === "likes, createdAt DESC" ? 'selected' : ''}>Least Popular</option>
      <option value="userUsername, createdAt DESC" ${queryParams.orderBy === "userUsername, createdAt DESC" ? 'selected' : ''}>User's Username</option>
      <option value="userUsername DESC, createdAt DESC" ${queryParams.orderBy === "userUsername DESC, createdAt DESC" ? 'selected' : ''}>User's Username (Reverse)</option>`;
    searchInput.value = queryParams.q ? queryParams.q : "";
    searchResultsOrderBy.innerHTML = orderByHTML;
    searchForm.addEventListener("submit", handleSearch);
    searchResultsPerPage.addEventListener("change", () => handleSearch());
    searchResultsOrderBy.addEventListener("change", () => handleSearch());
    deletePostBtn.addEventListener("click", handleDeletePost);
    cancelDeletePostBtn.addEventListener("click", handleCancelDeletePost);
    renderCurrentPosts();
});