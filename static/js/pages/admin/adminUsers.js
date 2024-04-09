const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchResultsPerPage = document.getElementById("search-results-perpage");
const searchBtn = document.getElementById("search-btn");
const searchResults = document.getElementById("search-results");
const searchFooter = document.getElementById("search-footer")
const deleteUserBtn = document.getElementById("delete-user-confirm");
const cancelDeleteUserBtn = document.getElementById("cancel-delete-user-confirm");
var currentUsers = [];
var currentResults = {};
var currentDeleteUser = null;
var queryParams = {};
const handleSearch = async (e) => {
    if (e) {
        e.preventDefault();
        delete queryParams.page;
    }
    queryParams.q = searchInput.value === "" ? null : searchInput.value;
    queryParams.resultsPerPage = parseInt(searchResultsPerPage.value);
    if (!queryParams.q) delete queryParams.q;
    renderCurrentUsers();
};
const clearSearch = async (e) => {
    searchInput.value = "";
    delete queryParams.q;
    queryParams.page = 1;
    renderCurrentUsers();
};
const changePage = (page) => {
    return () => {
        queryParams.page = page;
        renderCurrentUsers();
    };
};
const renderCurrentUsers = async () => {
    var url = `/shersocial/api/admin/users?`;
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
    if (data.users) {
        currentUsers = data.users;
        currentResults = {
            page: data.page,
            resultsPerPage: data.resultsPerPage,
            pages: data.pages
        }
    } else {
        currentUsers = [];
        currentResults = {
            resultsPerPage: queryParams.resultsPerPage,
            page: 1
        };
    }
    var innerHTML = "";
    currentUsers.forEach(u => {
        innerHTML += `<tr>
          <td class="align-middle">${u.username}</td>
          <td class="align-middle">${u.firstName} ${u.lastName}</td>
          <td class="align-middle">
          ${u.admin === 1
                ? `<button title="Unassign admin" role="button" class="btn btn-secondary" data-userid="${u.userId}">
                    <i class="fa-solid fa-user-slash" data-userid="${u.userId}"></i>
                </button>`
                : `<button title="Assign admin" role="button" class="btn btn-primary" data-userid="${u.userId}">
                    <i class="fa-solid fa-user-shield" data-userid="${u.userId}"></i>
                </button>`
            }
            <a title="View user" role="button" class="btn btn-info" href="/shersocial/@${u.username}" target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button title="Delete user" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#deleteUserModal" data-userid="${u.userId}">
              <i class="fa-solid fa-trash" data-userid="${u.userId}"></i>
            </button>
          </td>
        </tr>`;
    });
    searchResults.innerHTML = innerHTML;
    [...searchResults.querySelectorAll(`button.btn-danger[data-userid]`)].forEach(btn => {
        btn.addEventListener("click", handleDeleteOpen);
    });
    [...searchResults.querySelectorAll(`button.btn-primary[data-userid]`)].forEach(btn => {
        btn.addEventListener("click", handleAssignAdmin);
    });
    [...searchResults.querySelectorAll(`button.btn-secondary[data-userid]`)].forEach(btn => {
        btn.addEventListener("click", handleUnassignAdmin);
    });
    var footerHTML = "";
    if (queryParams.q) {
        footerHTML += `<tr>
          <td colspan="3" class="text-center">
            <a href id="clear-search" role="button">Clear Search</a>
          </td>
        </tr>`;
    }
    footerHTML += `<tr>
        <td colspan="3">
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
    const userId = e.target.getAttribute("data-userid");
    currentDeleteUser = currentUsers.filter(u => u.userId === userId)[0];
    document.getElementById("delete-modal-username").innerText = currentDeleteUser.username;
};
const handleDeleteUser = async () => {
    const res = await fetch(`/shersocial/api/admin/delete-user?userId=${currentDeleteUser.userId}`, {
        method: "DELETE"
    });
    if (res.ok) {
        currentDeleteUser = null;
        renderCurrentUsers();
    }
};
const handleCancelDeleteUser = () => {
    currentDeleteUser = null;
};
const handleAssignAdmin = async (e) => {
    const userId = e.target.getAttribute("data-userid");
    const res = await fetch(`/shersocial/api/admin/add-admin?userId=${userId}`, {
        method: "POST"
    });
    if (res.ok) {
        renderCurrentUsers();
    }
};
const handleUnassignAdmin = async (e) => {
    const userId = e.target.getAttribute("data-userid");
    const res = await fetch(`/shersocial/api/admin/remove-admin?userId=${userId}`, {
        method: "POST"
    });
    if (res.ok) {
        renderCurrentUsers();
    }
};
document.addEventListener("DOMContentLoaded", () => {
    queryParams = {
        q: window.location.search.match(/[\?&]q=([^&]*)/) ? window.location.search.match(/[\?&]q=([^&]*)/)[1] : null,
        page: window.location.search.match(/[\?&]page=([^&]*)/) ? parseInt(window.location.search.match(/[\?&]page=([^&]*)/)[1]) : 1,
        resultsPerPage: window.location.search.match(/[\?&]resultsPerPage=([^&]*)/) ? parseInt(window.location.search.match(/[\?&]resultsPerPage=([^&]*)/)[1]) : 10
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
    searchForm.addEventListener("submit", handleSearch);
    searchResultsPerPage.addEventListener("change", () => handleSearch());
    deleteUserBtn.addEventListener("click", handleDeleteUser);
    cancelDeleteUserBtn.addEventListener("click", handleCancelDeleteUser);
    renderCurrentUsers();
});