"use strict";

//* Imports:
import { defaultProjects } from "./data/data.js";

//* ======================= Data =======================
let storedProjects =
  JSON.parse(localStorage.getItem("projects")) || defaultProjects;

//* ======================= DOM Elements =======================
const projectTotalElement = document.getElementById("projectTotal");
const projectSearchInputElement = document.getElementById("projectSearchInput");
const createNewProjectButtonElement = document.getElementById(
  "createNewProjectButton"
);
const statusFilterTabsContainerElement =
  document.getElementById("statusFilterTabs");
const sortButtonsElements = document.querySelectorAll(".sort-button");
const selectAllProjectsElement = document.getElementById("selectAllProjects");
const bulkActionsContainerElement = document.getElementById(
  "bulkActionsContainer"
);
const bulkActionsButtonElement = document.getElementById("bulkActionsButton");
const projectsContainerElement = document.getElementById("projectsContainer");
const paginationInfoElement = document.getElementById("paginationInfo");
const paginationRowsSelectElement = document.getElementById(
  "paginationRowsSelect"
);
const paginationPrevButtonElement = document.getElementById(
  "paginationPrevButton"
);
const paginationNextButtonElement = document.getElementById(
  "paginationNextButton"
);
const paginationCurrentPageElement = document.getElementById(
  "paginationCurrentPage"
);

//* ======================= State Variables =======================
let projectSearchTerm = "";
let activeStatusFilter = "All";
let activeSortKey = "";
let activeSortOrder = "";
let currentPage = 1;
let rowsPerPage =
  JSON.parse(localStorage.getItem("paginationRowsPerPage")) || 5;
paginationRowsSelectElement.value = rowsPerPage;

let statusFilteredProjects = [];
let searchFilteredProjects = [];
let sortedProjects = [];
let paginatedProjects = [];

let lastProjectState = {};
let archivedProjectsSnapshot = [];
let previousProjectsSnapshot = [];

//* ======================= Functions =======================
const saveProjectsToLocalStorage = () => {
  localStorage.setItem("projects", JSON.stringify(storedProjects));
};

const updateProjectTotal = () => {
  projectTotalElement.textContent = storedProjects.length;
};

const createModalOverlay = (modalType) => {
  const overlay = document.createElement("div");
  overlay.className = `fixed top-0 left-0 w-full h-full z-[99]  ${
    modalType === "add" || modalType === "edit"
      ? "opacity-50 bg-black"
      : "opacity-10 bg-red-500"
  }`;
  return overlay;
};

//* Status Filter Tabs:
const renderStatusFilterTabs = () => {
  const STATUS_OPTIONS = [
    "All",
    "At Risk",
    "On Hold",
    "Potential Risk",
    "On Track",
    "Archived",
  ];
  statusFilterTabsContainerElement.innerHTML = "";
  STATUS_OPTIONS.forEach((statusFilter) => {
    const isSelected = statusFilter === activeStatusFilter;
    const projectsCount = countFilteredProjects(statusFilter);
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("status-filter-btn");
    button.dataset.active = isSelected;
    button.innerHTML = `${statusFilter}<span>${projectsCount}</span>`;
    handleStatusFilterButtonClickEvent(button, statusFilter);
    const listItem = document.createElement("li");
    listItem.appendChild(button);
    statusFilterTabsContainerElement.appendChild(listItem);
  });
};

const countFilteredProjects = (statusFilter) => {
  const statusFiltered = filterProjectsByStatus(statusFilter);
  const searchFiltered = filterProjectsBySearchTerm(statusFiltered);
  return searchFiltered.length;
};

const filterProjectsByStatus = (statusFilter) => {
  return storedProjects.filter((project) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Archived") return project.isArchived;
    return project.status === statusFilter;
  });
};

const updateStatusFilteredProjects = () => {
  statusFilteredProjects = filterProjectsByStatus(activeStatusFilter);
};

const handleStatusFilterButtonClickEvent = (button, statusFilter) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".status-filter-btn").forEach((tab) => {
      tab.dataset.active = "false";
    });
    button.dataset.active = "true";
    activeStatusFilter = statusFilter;
    currentPage = 1;
    refreshAndDisplayProjects();
    updateSelectAllProjectsElementState();
  });
};

//* Search:
const filterProjectsBySearchTerm = (array) => {
  return array.filter((project) =>
    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );
};

const updateSearchFilteredProjects = () => {
  searchFilteredProjects = filterProjectsBySearchTerm(statusFilteredProjects);
};

//*  Sort Buttons:
const initializeSortButtonHandlers = () => {
  sortButtonsElements.forEach((button) => {
    button.addEventListener("click", () => handleSortButtonClick(button));
  });
};

const handleSortButtonClick = (button) => {
  resetOtherSortButtons(button);
  const newClickCount = Number(button.dataset.clickCount) + 1;
  button.dataset.clickCount = newClickCount.toString();
  activeSortKey = button.dataset.sortKey;
  if (newClickCount === 1) {
    updateSortButtonState(button, true, "asc");
  } else if (newClickCount === 2) {
    updateSortButtonState(button, true, "desc");
  } else {
    resetSortButtonState(button);
    activeSortKey = "";
    activeSortOrder = "";
  }
  refreshAndDisplayProjects();
};

const resetOtherSortButtons = (activeButton) => {
  sortButtonsElements.forEach((button) => {
    if (button !== activeButton) {
      resetSortButtonState(button);
    }
  });
};

const updateSortButtonState = (button, isActive, order) => {
  button.dataset.active = isActive.toString();
  button.dataset.order = order;
  activeSortOrder = order;
};

const resetSortButtonState = (button) => {
  button.dataset.clickCount = "0";
  button.dataset.active = "false";
  button.dataset.order = "none";
};

const sortProjectsByActiveKey = (array) => {
  return array.sort((a, b) =>
    compareProjectValuesBySortOrder(
      a[activeSortKey],
      b[activeSortKey],
      activeSortOrder === "asc"
    )
  );
};

const compareProjectValuesBySortOrder = (a, b, isAsc) => {
  const compare = (valA, valB) => (isAsc ? valA - valB : valB - valA);
  switch (activeSortKey) {
    case "lastUpdated":
      return compare(new Date(a).getTime(), new Date(b).getTime());
    case "timeline": {
      const startA = new Date(a.startDate).getTime();
      const startB = new Date(b.startDate).getTime();
      const endA = new Date(a.endDate).getTime();
      const endB = new Date(b.endDate).getTime();
      return startA !== startB ? compare(startA, startB) : compare(endA, endB);
    }
    case "estimation":
      return compareMixedValues(a, b, compare);
    default:
      return compareGeneralValues(a, b, compare, isAsc);
  }
};

const compareMixedValues = (a, b, compareFunc) => {
  const isANumber = typeof a === "number";
  const isBNumber = typeof b === "number";
  if (isANumber && !isBNumber) return -1;
  if (!isANumber && isBNumber) return 1;
  if (!isANumber && !isBNumber) return 0;
  return compareFunc(a, b);
};

const compareGeneralValues = (a, b, compareFunc, isAsc) => {
  if (typeof a === "number" && typeof b === "number") {
    return compareFunc(a, b);
  }
  if (typeof a === "string" && typeof b === "string") {
    return isAsc ? a.localeCompare(b) : b.localeCompare(a);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareFunc(a.length, b.length);
  }
  return 0;
};

const updateSortedProjects = () => {
  sortedProjects = sortProjectsByActiveKey(searchFilteredProjects);
};

//* Pagination:
const paginateProjectsByRowsPerPage = (array, currentPage, rowsPerPage) => {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, array.length);
  return array.slice(startIndex, endIndex);
};

const updatePaginationControlsAndInfo = (
  currentPage,
  rowsPerPage,
  totalItems
) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const hasItems = totalItems > 0;
  const startItem = hasItems ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);
  updatePaginationInfoText(startItem, endItem, totalItems);
  updatePaginationCurrentPageDisplay(currentPage, totalPages, hasItems);
  updatePaginationButtonStates(currentPage, totalPages, hasItems);
};

const updatePaginationInfoText = (startItem, endItem, totalItems) => {
  paginationInfoElement.textContent = `${startItem}-${endItem} of ${totalItems}`;
};

const updatePaginationCurrentPageDisplay = (
  currentPage,
  totalPages,
  hasItems
) => {
  const currentPageClass = hasItems ? "text-gray-900" : "text-gray-500";
  const totalPagesClass =
    currentPage === totalPages ? "text-gray-900" : "text-gray-500";
  paginationCurrentPageElement.innerHTML = `
    <span class="${currentPageClass}">${hasItems ? currentPage : 0}</span> /
    <span class="${totalPagesClass}">${totalPages}</span>
  `;
};

const updatePaginationButtonStates = (currentPage, totalPages, hasItems) => {
  paginationPrevButtonElement.disabled = currentPage === 1;
  paginationNextButtonElement.disabled =
    !hasItems || currentPage === totalPages;
};

const goToPage = (targetPage) => {
  currentPage = targetPage;
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
};

const updatePaginatedProjects = () => {
  paginatedProjects = paginateProjectsByRowsPerPage(
    sortedProjects,
    currentPage,
    rowsPerPage
  );
};

//* Table Rows:
const renderProjectsTable = (array) => {
  if (array.length === 0) {
    projectsContainerElement.innerHTML = `<tr><td class="text-sm text-gray-900 py-3 px-2.5" colspan="100%">No projects found.</td></tr>`;
    return;
  }
  projectsContainerElement.innerHTML = "";
  array.forEach((project) => {
    projectsContainerElement.appendChild(createTableRow(project));
  });
};

const createTableRow = (project) => {
  const row = document.createElement("tr");
  row.className =
    "project-row border-y border-gray-1 transition-all hover:bg-gray-0";
  row.append(
    createCheckboxCell(project),
    createRowIndexCell(project),
    createNameCell(project),
    createManagerCell(project),
    createStatusCell(project),
    createLastUpdatedCell(project),
    createResourcesCell(project),
    createTimelineCell(project),
    createEstimationCell(project),
    createProjectActionsCell(project)
  );
  return row;
};

const createCheckboxCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "py-3 px-2.5 text-center";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "select-checkbox select-single-project";
  checkbox.checked = project.isSelected;
  checkbox.addEventListener("change", () => {
    project.isSelected = checkbox.checked;
    saveProjectsToLocalStorage();
    updateSelectAllProjectsElementState();
  });
  cell.appendChild(checkbox);
  return cell;
};

const createRowIndexCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "px-2.5 py-3 text-center text-sm text-gray-900";
  cell.textContent = project.rowIndex;
  return cell;
};

const createNameCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "px-2.5 py-3";
  cell.innerHTML = `
    <a href="#" class="text-indigo-500 text-sm font-medium inline-flex items-center gap-2 hover:underline group" target="_blank">
      ${project.name}
      <svg class="hidden group-hover:block fill-indigo-500" width="14" height="14" viewBox="0 0 14 14">
        <path d="M7.75 0C7.33 0 7 0.33 7 0.75C7 1.16 7.33 1.5 7.75 1.5L11.43 1.5L6.46 6.46C6.17 6.76 6.17 7.23 6.46 7.53C6.76 7.82 7.23 7.82 7.53 7.53L12.49 2.56L12.49 6.25C12.49 6.66 12.83 7 13.24 7C13.66 7 13.99 6.66 13.99 6.25L13.99 0.75C13.99 0.33 13.66 0 13.24 0L7.75 0ZM6 2.25C6 1.83 5.66 1.5 5.25 1.5L2 1.5C0.89 1.5 0 2.39 0 3.5L0 12C0 13.1 0.89 14 2 14L10.5 14C11.6 14 12.5 13.1 12.5 12L12.5 8.75C12.5 8.33 12.16 8 11.75 8C11.33 8 11 8.33 11 8.75L11 12C11 12.27 10.77 12.5 10.5 12.5L2 12.5C1.72 12.5 1.5 12.27 1.5 12L1.5 3.5C1.5 3.22 1.72 3 2 3L5.25 3C5.66 3 6 2.66 6 2.25Z" />
      </svg>
    </a>
  `;
  return cell;
};

const createManagerCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "py-3 px-2.5 flex items-center justify-center relative";
  const managerSlug = project.manager.replace(/\s+/g, "-").toLowerCase();
  const tooltip = createManagerTooltip(project);
  const showTooltip = () => cell.appendChild(tooltip);
  const hideTooltip = () => cell.querySelector(".manager-tooltip")?.remove();
  const img = new Image();
  img.src = `./images/${managerSlug}.png`;
  img.alt = `${project.manager} profile picture`;
  img.className = "w-6 h-6 rounded-md";
  img.onerror = () =>
    displayPMInitialsWhenImageFails(cell, project, showTooltip, hideTooltip);
  img.addEventListener("mouseover", showTooltip);
  img.addEventListener("mouseout", hideTooltip);
  cell.appendChild(img);
  return cell;
};

const displayPMInitialsWhenImageFails = (
  cell,
  project,
  showTooltip,
  hideTooltip
) => {
  const initials = project.manager
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0].toUpperCase())
    .join("");
  cell.innerHTML = `<span class="w-6 h-6 rounded-md flex items-center justify-center bg-gray-0 text-indigo-500 font-semibold text-[10px] border border-[#D2D5DC80]">${initials}</span>`;
  const initialsElement = cell.querySelector("span");
  initialsElement.addEventListener("mouseover", showTooltip);
  initialsElement.addEventListener("mouseout", hideTooltip);
};

const createManagerTooltip = (project) => {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip-base manager-tooltip";
  tooltip.innerHTML = `<h3 class="text-sm text-white font-medium">${project.manager}</h3>`;
  return tooltip;
};

const createStatusCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "status-cell";
  const container = document.createElement("div");
  container.className = "px-2.5 py-3 flex justify-center relative";
  const statusClass = project.status.replace(/\s+/g, "-").toLowerCase();
  container.innerHTML = `
    <button type="button"
      class="${statusClass} status-toggle-btn py-0.5 px-2 text-xs font-medium rounded flex gap-1.5 items-center justify-center border-none group">
      <span class="${statusClass}-indicator block w-1.5 h-1.5 rounded-sm"></span>
      ${project.status}
      <i class="ph-bold ph-caret-down hidden group-hover:block status-toggle-icon"></i>
    </button>
  `;
  const statusToggleButton = container.querySelector(".status-toggle-btn");
  const statusUpdateForm = createStatusUpdateForm(project, container);
  const toggleUpdateFormVisibility = () => {
    const existingForm = container.querySelector(".status-update-form");
    if (existingForm) {
      existingForm.remove();
    } else {
      container.appendChild(statusUpdateForm);
    }
  };
  statusToggleButton.addEventListener("click", toggleUpdateFormVisibility);
  cell.appendChild(container);
  return cell;
};

const createStatusUpdateForm = (project, container) => {
  const form = document.createElement("form");
  form.className = "status-update-form";
  form.innerHTML = `
    <div id="formBody" class="px-1.5 py-3">
      <h2 class="font-medium text-sm text-gray-700 ml-2.5 mb-1.5">Update Project Status</h2>
    </div>
    <div class="form-actions bg-white px-4 py-3 flex justify-end gap-5 rounded-b-lg">
      <button type="button" class="cancel-btn text-sm font-medium text-gray-700">Cancel</button>
      <button type="submit" class="submit-btn text-sm font-medium text-indigo-500 disabled:text-indigo-300" disabled >Submit</button>
    </div>
  `;
  const formBody = form.querySelector("#formBody");
  const cancelBtn = form.querySelector(".cancel-btn");
  const submitBtn = form.querySelector(".submit-btn");
  const statusList = createStatusOptionsList(project, submitBtn);
  formBody.appendChild(statusList);
  cancelBtn.addEventListener("click", () => form.remove());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateProjectStatus(project);
    form.remove();
  });
  const closeOnOutsideClick = (event) => {
    if (!container.contains(event.target)) {
      form.remove();
    }
  };
  document.addEventListener("click", closeOnOutsideClick);
  return form;
};

const createStatusOptionsList = (project, submitBtn) => {
  const PROJECT_STATUSES = ["At Risk", "On Hold", "Potential Risk", "On Track"];
  const list = document.createElement("ul");
  list.className = "status-options-list";
  PROJECT_STATUSES.forEach((status) => {
    const statusClass = status.replace(/\s+/g, "-").toLowerCase();
    const inputId = `${statusClass}-${project.rowIndex}`;
    const isCurrent = status === project.status;
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <label for="${inputId}" class="font-medium text-sm text-gray-700 rounded flex items-baseline cursor-pointer gap-2.5 w-full py-1 px-3 transition-all duration-300 ease-in-out hover:bg-indigo-0 has-[:checked]:bg-indigo-500 has-[:checked]:text-white">
        <span class="${statusClass}-indicator w-2.5 h-2.5 rounded-sm block"></span>
        ${status}
        <input
          type="radio"
          class="status-option-input hidden"
          name="project-status"
          value="${status}"
          id="${inputId}"
          ${isCurrent ? "checked" : ""}
        />
      </label>
    `;
    const inputEl = listItem.querySelector("input");
    inputEl.addEventListener("click", () => {
      submitBtn.disabled = isCurrent;
    });
    list.appendChild(listItem);
  });
  return list;
};

const createLastUpdatedCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "px-2.5 py-3";
  cell.innerHTML = `
  <div class="flex items-center justify-center gap-2">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.75 12C1.75 13.2426 2.75736 14.25 4 14.25H10.2485C10.5513 14.25 10.8438 14.1401 11.0717 13.9407L13.8231 11.5332C14.0944 11.2958 14.25 10.9529 14.25 10.5925V4C14.25 2.75736 13.2426 1.75 12 1.75H4C2.75736 1.75 1.75 2.75736 1.75 4V12Z" stroke="#5E5ADB" stroke-width="1.5"/>
    <path d="M5.25 6.5H10.75" stroke="#5E5ADB" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M5.25 9.5H8.75" stroke="#5E5ADB" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span class="text-sm text-gray-900 text-nowrap">
    ${formatLastUpdatedForDisplay(project.lastUpdated)}
    </span>
  </div>
  `;
  return cell;
};

const formatLastUpdatedForDisplay = (date) => {
  return new Date(date)
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/am|pm/i, (m) => m.toUpperCase());
};

const createResourcesCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "py-3 px-2.5 text-center relative";
  const resourceCount = document.createElement("span");
  resourceCount.className =
    "text-sm text-gray-700 text-center rounded-md bg-indigo-0 px-[7px] py-1";
  resourceCount.textContent = project.resources.length;
  const tooltip = createResourcesTooltip(project);
  const showTooltip = () => {
    if (!cell.querySelector(".resource-tooltip")) {
      cell.appendChild(tooltip);
    }
  };
  const hideTooltip = () => {
    const existingTooltip = cell.querySelector(".resource-tooltip");
    if (existingTooltip) existingTooltip.remove();
  };
  resourceCount.addEventListener("mouseover", showTooltip);
  resourceCount.addEventListener("mouseout", hideTooltip);
  cell.appendChild(resourceCount);
  return cell;
};

const createResourcesTooltip = (project) => {
  const container = document.createElement("div");
  container.className = "tooltip-base resource-tooltip";
  const title = document.createElement("h2");
  title.className = "text-xs text-indigo-200 font-medium uppercase text-center";
  title.textContent = "Resources";
  const list = document.createElement("ul");
  list.className = "flex flex-col gap-3 mt-3";
  if (project.resources.length === 0) {
    list.innerHTML = `<li class="text-sm text-white text-left font-medium">No resources</li>`;
  } else {
    project.resources.forEach((resource) => {
      const listItem = document.createElement("li");
      listItem.className = "text-sm text-white text-left font-medium";
      listItem.textContent = resource;
      list.appendChild(listItem);
    });
  }
  container.append(title, list);
  return container;
};

const createTimelineCell = (project) => {
  const cell = document.createElement("td");
  cell.className =
    "px-2.5 py-3 text-sm text-gray-900 flex items-center justify-center gap-2";
  const badgeClass =
    "text-sm text-gray-700 rounded-md bg-indigo-50 px-2.5 py-1 whitespace-nowrap";
  const startDate = document.createElement("span");
  const separatorIcon = document.createElement("i");
  const endDate = document.createElement("span");
  startDate.className = badgeClass;
  endDate.className = badgeClass;
  separatorIcon.className = "ph-bold ph-caret-right text-gray-400";
  startDate.textContent = formatTimelineDateForDisplay(
    project.timeline.startDate
  );
  endDate.textContent = formatTimelineDateForDisplay(project.timeline.endDate);
  cell.append(startDate, separatorIcon, endDate);
  return cell;
};

const formatTimelineDateForDisplay = (date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const createEstimationCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "px-2.5 py-3 text-center text-sm text-gray-900";
  cell.textContent = formatEstimationForDisplay(project.estimation);
  return cell;
};

const formatEstimationForDisplay = (value) => {
  if (value === null) return "-";
  if (value >= 1e12) {
    return `US$ ${(value / 1e12).toFixed(1)}t`;
  } else if (value >= 1e9) {
    return `US$ ${(value / 1e9).toFixed(1)}b`;
  } else if (value >= 1e6) {
    return `US$ ${(value / 1e6).toFixed(1)}m`;
  } else if (value >= 1e3) {
    return `US$ ${(value / 1e3).toFixed(1)}k`;
  }
  return `US$ ${value}`;
};

const createProjectActionsCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "py-3 px-2.5";
  const dropdownContainer = document.createElement("div");
  dropdownContainer.className = "w-fit mx-auto relative";
  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className =
    "ph-bold ph-dots-three-vertical text-gray-400 p-1 rounded transition-all duration-300 ease-in-out hover:bg-indigo-0 hover:text-gray-700";
  const actionsDropdown = createProjectActionsDropdown(
    project,
    dropdownContainer
  );
  dropdownContainer.appendChild(toggleButton);
  cell.appendChild(dropdownContainer);
  toggleButton.addEventListener("click", () => {
    dropdownContainer.appendChild(actionsDropdown);
  });
  return cell;
};

const createProjectActionsDropdown = (project, container) => {
  const dropdownList = document.createElement("ul");
  dropdownList.className =
    "actionsDropdown absolute top-0 right-0 bg-white py-2 px-1.5 rounded-md z-10 shadow-dropdownActions";
  dropdownList.innerHTML = `
  <li>
    <button type="button" class="edit-btn px-2.5 py-1 w-full hover:bg-indigo-0 rounded-md text-left font-medium text-sm text-gray-700">Edit</button>
  </li>
  <li>
    <button type="button" class="archive-btn px-2.5 py-1 w-full hover:bg-indigo-0 rounded-md text-left font-medium text-sm text-orange-500">
      ${project.isArchived ? "Unarchive" : "Archive"}
    </button>
  </li>
  <li>
    <button type="button" class="delete-btn px-2.5 py-1 w-full hover:bg-indigo-0 rounded-md text-left font-medium text-sm text-red-500">Delete</button>
  </li>
  `;
  const editBtn = dropdownList.querySelector(".edit-btn");
  const archiveBtn = dropdownList.querySelector(".archive-btn");
  const deleteBtn = dropdownList.querySelector(".delete-btn");
  editBtn.addEventListener("click", () => {
    openProjectEditingModal(project);
    dropdownList.remove();
  });
  archiveBtn.addEventListener("click", () => {
    toggleProjectArchivalStatus(project);
    dropdownList.remove();
  });
  deleteBtn.addEventListener("click", () => {
    showProjectDeletionModal(project);
    dropdownList.remove();
  });
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdownList.remove();
    }
  });
  return dropdownList;
};

//* Project Actions:
const updateProjectStatus = (project) => {
  const selectedStatusOption = document.querySelector(
    ".status-option-input:checked"
  );
  const newStatus = selectedStatusOption.value;
  lastProjectState = { ...project };
  project.status = newStatus;
  project.lastUpdated = new Date().toUTCString();
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
  showProjectStatusUpdateNotification(project);
};

const showProjectStatusUpdateNotification = (project) => {
  createToastNotification(`Status updated to "${project.status}".`, true, () =>
    undoProjectStatusChange(project)
  );
};

const undoProjectStatusChange = (project) => {
  project.status = lastProjectState.status;
  project.lastUpdated = lastProjectState.lastUpdated;
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  updateAndRenderVisibleProjects();
  updateSelectAllProjectsElementState();
};

const toggleProjectArchivalStatus = (project) => {
  lastProjectState = { ...project };
  project.isArchived = !project.isArchived;
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
  showProjectArchivalNotification(project);
};

const showProjectArchivalNotification = (project) => {
  createToastNotification(
    project.isArchived
      ? 'Project successfully "Archived".'
      : 'Project successfully "Unarchived".',
    true,
    () => undoProjectArchiving(project)
  );
};

const undoProjectArchiving = (project) => {
  project.isArchived = lastProjectState.isArchived;
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
};

//* Bulk Actions Dropdown:
const createBulkActionsDropdown = (dropdownContainer) => {
  const dropdownList = document.createElement("ul");
  dropdownList.className =
    "bulk-actions-dropdown absolute top-0 right-0 bg-white py-2 px-1.5 rounded-md z-10 shadow-dropdownActions";
  dropdownList.innerHTML = `
    <li>
      <button type="button" id="archiveButton" class="px-2.5 py-1 w-full hover:bg-indigo-50 rounded-md text-left font-medium text-sm text-orange-500">
        ${areAllProjectsArchived() ? "Unarchive" : "Archive"}
      </button>
    </li>
    <li>
      <button type="button" id="deleteButton" class="px-2.5 py-1 w-full hover:bg-indigo-50 rounded-md text-left font-medium text-sm text-red-500">Delete</button>
    </li>
  `;
  const archiveButton = dropdownList.querySelector("#archiveButton");
  const deleteButton = dropdownList.querySelector("#deleteButton");
  archiveButton.addEventListener("click", () => {
    toggleBulkProjectsArchivalStatus();
    dropdownList.remove();
  });
  deleteButton.addEventListener("click", () => {
    showBulkDeletionModal();
    dropdownList.remove();
  });
  document.addEventListener("click", (event) => {
    if (!dropdownContainer.contains(event.target)) {
      dropdownList.remove();
    }
  });
  return dropdownList;
};

const areAllProjectsArchived = () => {
  return paginatedProjects.every(
    (project) => !project.isSelected || project.isArchived
  );
};

const toggleBulkProjectsArchivalStatus = () => {
  const selectedProjects = paginatedProjects.filter(
    (project) => project.isSelected
  );
  const shouldArchive = selectedProjects.some((project) => !project.isArchived);
  selectedProjects.forEach((project) => {
    project.isArchived = shouldArchive;
  });
  archivedProjectsSnapshot = [...selectedProjects];
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
  showBulkArchivalStatusNotification(shouldArchive, selectedProjects.length);
};

const showBulkArchivalStatusNotification = (wasArchived, affectedCount) => {
  const actionText = wasArchived ? "Archived" : "Unarchived";
  createToastNotification(
    `${affectedCount} project${
      affectedCount > 1 ? "s" : ""
    } successfully "${actionText}".`,
    true,
    () => {
      undoLastBulkArchiveAction(wasArchived);
    }
  );
};

const undoLastBulkArchiveAction = (wasArchived) => {
  archivedProjectsSnapshot.forEach((project) => {
    project.isArchived = !wasArchived;
  });
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
};

//* Select Projects:
const updateSelectAllProjectsElementState = () => {
  const hasSelected = paginatedProjects.some((project) => project.isSelected);
  const allSelected = paginatedProjects.every((project) => project.isSelected);
  selectAllProjectsElement.disabled = paginatedProjects.length === 0;
  selectAllProjectsElement.checked = hasSelected;
  selectAllProjectsElement.classList.toggle(
    "checked:after:content-['✓']",
    allSelected
  );
  selectAllProjectsElement.classList.toggle(
    "checked:after:content-['-']",
    !allSelected && hasSelected
  );
  updateBulkActionsDisplay();
};

const updateBulkActionsDisplay = () => {
  bulkActionsButtonElement.classList.toggle(
    "hidden",
    !selectAllProjectsElement.checked
  );
};

const syncProjectSelectionWithSelectAllProjectsElement = () => {
  const selectAll = selectAllProjectsElement.checked;
  paginatedProjects.forEach((project) => {
    project.isSelected = selectAll;
  });
  saveProjectsToLocalStorage();
  refreshAndDisplayProjects();
};

const deselectAllProjectsAndRefreshUI = () => {
  storedProjects.forEach((project) => (project.isSelected = false));
  saveProjectsToLocalStorage();
  refreshAndDisplayProjects();
};

//* Toast Notification:
const clearExistingToast = () => {
  const existingToast = document.querySelector(".toast-notification");
  if (existingToast) existingToast.remove();
};

const createToastNotification = (message, showUndo = false, onUndo = null) => {
  clearExistingToast();
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 15.5C12.1421 15.5 15.5 12.1421 15.5 8C15.5 3.85786 12.1421 0.5 8 0.5C3.85786 0.5 0.5 3.85786 0.5 8C0.5 12.1421 3.85786 15.5 8 15.5ZM10.427 5.39255C10.7106 5.0916 11.2362 5.14816 11.5278 5.39255C11.8534 5.66547 11.7932 6.11611 11.5278 6.39768L7.56268 10.6053C7.30802 10.8756 6.71524 10.8875 6.46185 10.6053L4.46953 8.38686C4.19295 8.07889 4.16113 7.68848 4.46953 7.38172C4.73477 7.1179 5.31108 7.09302 5.57035 7.38172L7.02551 9.00207L10.427 5.39255Z" fill="#A9EBCA"/>
    </svg>
    <span>${message}</span>
    ${
      showUndo
        ? `<span class="text-green-900">|</span><button id="undoButton" class="text-sm font-semibold text-green-100">Undo</button>`
        : ""
    }`;
  document.body.appendChild(toast);
  const undoButton = toast.querySelector("#undoButton");
  if (showUndo && typeof onUndo === "function") {
    undoButton.addEventListener("click", () => {
      onUndo();
      toast.remove();
      showSuccessNotification("Action undone.");
    });
  }
  setTimeout(() => toast.remove(), 5000);
};

const showSuccessNotification = (message) => {
  createToastNotification(message);
};

//* Delete Projects:
const showBulkDeletionModal = () => createDeletionConfirmationModal("bulk");

const showProjectDeletionModal = (project) =>
  createDeletionConfirmationModal("single", project);

const createDeletionConfirmationModal = (deletionType, project = {}) => {
  const form = document.createElement("form");
  form.className =
    "fixed max-w-[440px] rounded-xl w-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-deletionForm bg-white z-[100]";
  form.append(
    createDeletionModalHeader(deletionType, project),
    createDeletionModalFooter(deletionType)
  );
  const overlay = createModalOverlay(deletionType);
  document.body.append(form, overlay);
  const cancelButton = form.querySelector("#cancelButton");
  cancelButton.addEventListener("click", () => {
    form.remove();
    overlay.remove();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleDeletionModalSubmit(deletionType, project);
    form.remove();
    overlay.remove();
  });
};

const createDeletionModalHeader = (deletionType, project) => {
  const header = document.createElement("div");
  const isSingle = deletionType === "single";
  const selectedCount = paginatedProjects.filter(
    (project) => project.isSelected
  ).length;
  const targetText = isSingle
    ? `<span class="font-medium text-gray-900">${project.name}</span>? If you do, It will be permanently lost.`
    : `<span class="font-medium text-gray-900">${
        selectedCount === 1 ? "1 project?" : `${selectedCount} projects`
      }</span> If you do, ${
        selectedCount === 1 ? "It" : "They"
      } will be permanently lost.`;
  header.innerHTML = `
    <div class="py-4 px-5">
      <h2 class="text-[20px] font-bold text-gray-900">${
        isSingle || selectedCount === 1 ? "Delete Project" : "Delete Projects"
      }</h2>
      <p class="text-base font-normal leading-6 tracking-normal text-gray-700 mt-2.5">
        Are you sure you want to delete ${targetText}
      </p>
    </div>
    <span class="bg-gray-100 w-full block h-[2px]"></span>
  `;
  return header;
};

const createDeletionModalFooter = (deletionType) => {
  const footer = document.createElement("div");
  footer.className =
    "bg-white px-5 py-4 flex gap-5 justify-end items-center rounded-bl-xl rounded-br-xl";
  const selectedProjectsCount = paginatedProjects.filter(
    (project) => project.isSelected
  ).length;
  const buttonLabel =
    deletionType === "single" || selectedProjectsCount === 1
      ? "Delete project"
      : "Delete projects";
  footer.innerHTML = `
    <button type="button" id="cancelButton" class="button secondary-button">Cancel</button>
    <button type="submit" class="button danger-button">${buttonLabel}</button>
  `;
  return footer;
};

const handleDeletionModalSubmit = (deletionType, targetProject) => {
  previousProjectsSnapshot = [...storedProjects];
  if (deletionType === "single") {
    storedProjects = storedProjects.filter(
      (project) => project.id !== targetProject.id
    );
    showProjectDeletionNotification();
  } else {
    let selectedProjects = paginatedProjects.filter((p) => p.isSelected);
    storedProjects = storedProjects.filter(
      (project) =>
        !selectedProjects.some((selected) => selected.id === project.id)
    );
    selectedProjects.forEach((project) => (project.isSelected = false));
    showBulkDeletionNotification(selectedProjects.length);
  }
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
};

const showProjectDeletionNotification = () => {
  createToastNotification("Project deleted.", true, () => undoDeletionAction());
};

const showBulkDeletionNotification = (deletedCount) => {
  createToastNotification(
    `
    ${deletedCount} project${deletedCount > 1 ? "s" : ""} successfully deleted.
    `,
    true,
    () => undoDeletionAction()
  );
};

const undoDeletionAction = () => {
  storedProjects = [...previousProjectsSnapshot];
  saveProjectsToLocalStorage();
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
};

//* Add & Edit Forms:
const openProjectCreationModal = () => createProjectModal("add");

const openProjectEditingModal = (project) =>
  createProjectModal("edit", project);

const createProjectModal = (action, project = {}) => {
  const form = document.createElement("form");
  form.className =
    "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[90%] min-[497px]:max-w-[440px] w-full shadow-projectForm rounded-xl z-[100] overflow-hidden";
  form.append(
    createProjectModalHeader(action),
    createProjectModalBody(action, project, form),
    createProjectModalFooter(action)
  );
  const overlay = createModalOverlay(action);
  document.body.append(form, overlay);
  const cancelBtn = form.querySelector(".cancelBtn");
  const submitBtn = form.querySelector(".submitBtn");
  cancelBtn.addEventListener("click", () => {
    form.remove();
    overlay.remove();
  });
  toggleSubmitButtonState(action, form, project, submitBtn);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleProjectFormSubmission(action, form, project);
    form.remove();
    overlay.remove();
  });
};

const createProjectModalHeader = (action) => {
  const header = document.createElement("h2");
  header.className =
    "text-gray-900 bg-white text-base font-medium leading-5 px-5 py-4";
  header.textContent = action === "add" ? "Add New Project" : "Edit Project";
  return header;
};

const createProjectModalBody = (action, project, form) => {
  const body = document.createElement("div");
  body.className = "flex flex-col gap-8 px-5 py-4 bg-gray-0";
  body.append(
    createNameInputField(action, project),
    createManagerSelectionGroup(action, project),
    createResourceSelectionCheckboxGroup(action, project),
    createTimelineInputField(action, project, form),
    createEstimationInputField(action, project)
  );
  return body;
};

const createNameInputField = (action, project) => {
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2";
  const defaultName = action === "add" ? "" : project.name;
  container.innerHTML = `
    <label for="nameInput" class="text-sm font-medium leading-5 text-gray-700 cursor-pointer">
      Project name <span class="text-indigo-500">*</span>
    </label>
    <input type="text" id="nameInput" class="primary-input" value="${defaultName}">
    <p id="projectNameErrorMsg" class="text-red-500 text-xs"></p>
  `;
  const nameInput = container.querySelector("#nameInput");
  const errorMsg = container.querySelector("#projectNameErrorMsg");
  nameInput.addEventListener("input", () => {
    errorMsg.textContent = validateProjectName(
      nameInput.value.trim(),
      defaultName
    );
  });
  return container;
};

const createManagerSelectionGroup = (action, project) => {
  const PROJECT_MANAGERS = ["Leo Gouse", "Roger Vaccaro", "Tatiana Dias"];
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2";
  const label = document.createElement("label");
  label.className = "text-sm font-medium text-gray-700";
  label.textContent = "Project Manager (PM)";
  container.appendChild(label);
  const radioGroup = document.createElement("ul");
  radioGroup.className =
    "flex flex-col min-[537px]:flex-row min-[537px]:w-fit gap-1 rounded-md bg-gray-1 p-1";
  PROJECT_MANAGERS.forEach((manager) => {
    const radioInput = document.createElement("input");
    radioInput.className = "hidden peer";
    radioInput.type = "radio";
    radioInput.name = "projectManager";
    radioInput.value = manager;
    radioInput.id = manager.replace(/\s+/g, "-").toLowerCase();
    radioInput.checked =
      action === "add" ? manager === "Leo Gouse" : manager === project.manager;
    const radioLabel = document.createElement("label");
    radioLabel.htmlFor = manager.replace(/\s+/g, "-").toLowerCase();
    radioLabel.textContent = manager;
    radioLabel.className =
      "cursor-pointer block text-gray-700 text-sm font-medium tracking-[0.28px] py-1 px-2.5 transition duration-300 hover:text-indigo-500 peer-checked:bg-white peer-checked:rounded peer-checked:managerRadioInputChecked peer-checked:text-indigo-500";
    const radioItem = document.createElement("li");
    radioItem.append(radioInput, radioLabel);
    radioGroup.appendChild(radioItem);
  });
  container.appendChild(radioGroup);
  return container;
};

const createResourceSelectionCheckboxGroup = (action, project) => {
  const PROJECT_RESOURCES = [
    "UX/UI Design",
    "Frontend",
    "Backend",
    "Full Stack",
    "Graphic Designer",
    "Web Designer",
    "QA",
  ];
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2";
  const label = document.createElement("label");
  label.className =
    "text-sm font-medium leading-5 text-gray-700 cursor-pointer";
  label.textContent = "Resources";
  container.appendChild(label);
  const checkboxGroup = document.createElement("ul");
  checkboxGroup.className = "flex items-center gap-2.5 flex-wrap";
  PROJECT_RESOURCES.forEach((resourceName) => {
    const checkboxInput = document.createElement("input");
    checkboxInput.className = "hidden peer";
    checkboxInput.type = "checkbox";
    checkboxInput.name = "resource";
    checkboxInput.value = resourceName;
    checkboxInput.id = resourceName.replace(/\s+/g, "-").toLowerCase();
    checkboxInput.checked =
      action === "add" ? false : project.resources.includes(resourceName);
    const checkboxLabel = document.createElement("label");
    checkboxLabel.htmlFor = resourceName.replace(/\s+/g, "-").toLowerCase();
    checkboxLabel.textContent = resourceName;
    checkboxLabel.className =
      "resource-checkbox peer-checked:text-white peer-checked:bg-indigo-500 peer-checked:resourceCheckboxChecked peer-checked:hover:bg-indigo-600 peer-checked:hover:shadow-resourceCheckboxCheckedHover peer-checked:active:shadow-resourceCheckboxCheckedActive";
    const checkboxItem = document.createElement("li");
    checkboxItem.append(checkboxInput, checkboxLabel);
    checkboxGroup.appendChild(checkboxItem);
  });
  container.appendChild(checkboxGroup);
  return container;
};

const createTimelineInputField = (action, project, form) => {
  const durations = [
    "15 days",
    "1 month",
    "1-2 months",
    "3 months",
    "4-6 months",
    "1 year",
    "custom",
  ];
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2";
  const label = document.createElement("label");
  label.htmlFor = "timelineDuration";
  label.className = "text-sm font-medium text-gray-700 cursor-pointer";
  label.textContent = "Project Timeline";
  const select = document.createElement("select");
  select.name = "timelineDuration";
  select.id = "timelineDuration";
  select.className = "primary-input";
  durations.forEach((duration) => {
    const option = document.createElement("option");
    option.value = duration;
    option.textContent = duration;
    option.selected =
      action === "add"
        ? duration === "15 days"
        : duration === project.timeline.duration;
    select.appendChild(option);
  });
  const customDatesContainer = document.createElement("div");
  customDatesContainer.className = "flex flex-col gap-2";
  const errorMsg = document.createElement("p");
  errorMsg.className = "text-red-500 text-xs";
  const createDateInput = (name, value = "") => {
    const input = document.createElement("input");
    input.type = "date";
    input.name = name;
    input.id = name;
    input.className = "primary-input";
    input.value = value;
    input.addEventListener("input", () => {
      const startDate =
        customDatesContainer.querySelector("#startDateInput").value;
      const endDate = customDatesContainer.querySelector("#endDateInput").value;
      errorMsg.textContent = validateProjectDuration(startDate, endDate);
    });
    return input;
  };
  const handleCustomSelection = () => {
    customDatesContainer.innerHTML = "";
    errorMsg.textContent = "";
    if (select.value === "custom") {
      const startDateInput = createDateInput(
        "startDateInput",
        project?.timeline?.startDate || ""
      );
      const endDateInput = createDateInput(
        "endDateInput",
        project?.timeline?.endDate || ""
      );
      customDatesContainer.append(startDateInput, endDateInput, errorMsg);
    }
  };
  select.addEventListener("change", handleCustomSelection);
  if (project?.timeline?.duration === "custom") {
    handleCustomSelection();
  }
  container.append(label, select, customDatesContainer);
  return container;
};

const createEstimationInputField = (action, project) => {
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2";
  const estimatedValue =
    action === "add" || project.estimation === null ? "" : project.estimation;
  container.innerHTML = `
    <label for="estimationInput" class="text-sm font-medium leading-5 text-gray-700 cursor-pointer">
      Estimation
    </label>
    <div class="relative">
      <span class="font-medium text-sm text-gray-400 absolute top-2/4 -translate-y-2/4 left-3">US$</span>
      <input type="text" id="estimationInput" style="padding-left: 48px;" placeholder="00.00" class="primary-input estimation-input placeholder:text-gray-300 w-full" value="${estimatedValue}">
    </div>
    <p id="projectEstimationErrorMsg" class="text-red-500 text-xs"></p>
  `;
  const estimationInput = container.querySelector("#estimationInput");
  const errorMsg = container.querySelector("#projectEstimationErrorMsg");
  estimationInput.addEventListener("input", () => {
    errorMsg.textContent = validateProjectEstimation(estimationInput.value);
  });
  return container;
};

const createProjectModalFooter = (action) => {
  const footer = document.createElement("div");
  footer.className =
    "bg-white px-5 py-4 flex gap-5 justify-end items-center rounded-bl-xl rounded-br-xl";
  const buttonLabel = action === "add" ? "Add project" : "Save changes";
  footer.innerHTML = `
    <button type="button" class="cancelBtn button secondary-button">Cancel</button>
    <button type="submit" class="submitBtn button primary-button" disabled>${buttonLabel}</button>
  `;
  return footer;
};

//* Handle Project Forms:
const validateProjectName = (newName, defaultName) => {
  if (!newName) return "Project name is required.";
  if (!/^[a-zA-Z- ]+$/.test(newName)) return "Only letters and spaces allowed.";
  if (newName.length < 5) return "Must be at least 5 characters.";
  if (isProjectNameDuplicate(newName, defaultName))
    return "Name already exists.";
  return "";
};

const isProjectNameDuplicate = (newName, defaultName) =>
  storedProjects.some(
    (project) => project.name === newName && project.name !== defaultName
  );

const validateProjectDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end)
    return "The start date must be earlier than the end date. Please select a valid project timeline.";
  return "";
};

const validateProjectEstimation = (newEstimation) => {
  if (!newEstimation) return "";
  const num = Number(newEstimation);
  if (isNaN(num)) return "Estimation must be a number.";
  if (num < 0) return "Estimation must be greater than 0.";
  if (/^0\d+/.test(newEstimation)) return "Remove unnecessary leading zeros.";
  if (!/^\d+(\.\d{1,2})?$/.test(newEstimation)) {
    return "Use up to 2 decimal places and no spaces.";
  }
  if (num >= 1e12) return "Estimation cannot exceed US$ 1 trillion.";
  return "";
};

const toggleSubmitButtonState = (action, form, project, submitBtn) => {
  const nameInput = form.querySelector("#nameInput");
  const estimationInput = form.querySelector("#estimationInput");
  const durationSelect = form.querySelector("#timelineDuration");
  const pmInputs = form.querySelectorAll('input[name="projectManager"]');
  const resourceInputs = form.querySelectorAll('input[name="resource"]');
  const handleChange = () => {
    const startDate = form.querySelector("#startDateInput")?.value || "";
    const endDate = form.querySelector("#endDateInput")?.value || "";
    const newName = nameInput.value.trim();
    const estimationValue = estimationInput.value.trim();
    const newEstimation =
      estimationValue === "" ? null : Number(estimationValue);
    const selectedPm = form.querySelector(
      'input[name="projectManager"]:checked'
    )?.value;
    const selectDuration = durationSelect.value;
    const selectedResources = Array.from(
      form.querySelectorAll('input[name="resource"]:checked')
    ).map((cb) => cb.value);
    const projectEstimation =
      project.estimation === null ? null : Number(project.estimation);
    const projectResources = Array.isArray(project.resources)
      ? project.resources
      : [];
    const isInvalidName = !!validateProjectName(newName, project.name);
    const isInvalidEstimation = !!validateProjectEstimation(estimationValue);
    const isInvalidDuration =
      selectDuration === "custom" &&
      (!startDate || !endDate || startDate >= endDate);
    const isSameDates =
      startDate === project?.timeline?.startDate &&
      endDate === project?.timeline?.endDate;
    const isUnchanged =
      newName === project.name &&
      selectedPm === project.manager &&
      newEstimation === projectEstimation &&
      selectDuration === project?.timeline?.duration &&
      JSON.stringify(selectedResources.sort()) ===
        JSON.stringify(projectResources.sort());
    if (action === "add") {
      submitBtn.disabled =
        isInvalidName || isInvalidEstimation || isInvalidDuration;
    } else if (action === "edit") {
      const disableInEdit =
        isInvalidName ||
        isInvalidEstimation ||
        isInvalidDuration ||
        isUnchanged ||
        (selectDuration === "custom" && isSameDates);
      submitBtn.disabled = disableInEdit;
    }
  };
  nameInput.addEventListener("input", handleChange);
  estimationInput.addEventListener("input", handleChange);
  durationSelect?.addEventListener("change", () => {
    handleChange();
    const newStart = form.querySelector("#startDateInput");
    const newEnd = form.querySelector("#endDateInput");
    newStart?.addEventListener("input", handleChange);
    newEnd?.addEventListener("input", handleChange);
  });
  pmInputs.forEach((input) => input.addEventListener("change", handleChange));
  resourceInputs.forEach((input) =>
    input.addEventListener("change", handleChange)
  );
  handleChange();
};

const handleProjectFormSubmission = (action, form, project) => {
  const name = form.querySelector("#nameInput").value.trim();
  const manager = form.querySelector(
    'input[name="projectManager"]:checked'
  ).value;
  const resources = Array.from(
    form.querySelectorAll('input[name="resource"]:checked')
  ).map((checkbox) => checkbox.value);
  const duration = form.querySelector("#timelineDuration").value;
  const startDate = form?.querySelector("#startDateInput")?.value;
  const endDate = form?.querySelector("#endDateInput")?.value;
  const estimation = form.querySelector("#estimationInput").value;
  action === "add"
    ? addProject(
        name,
        manager,
        resources,
        duration,
        startDate,
        endDate,
        estimation
      )
    : editProject(
        project,
        name,
        manager,
        resources,
        duration,
        startDate,
        endDate,
        estimation
      );
  saveProjectsToLocalStorage();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
};

const addProject = (
  name,
  manager,
  resources,
  duration,
  startDate,
  endDate,
  estimation
) => {
  const newProject = {
    isSelected: false,
    rowIndex: 1,
    id: Date.now(),
    name: name,
    status: "On Track",
    isArchived: false,
    manager: manager || "Leo Gouse",
    lastUpdated: new Date().toUTCString(),
    resources: resources,
    timeline: {
      duration: duration,
      startDate:
        duration === "custom"
          ? startDate
          : new Date().toISOString().split("T")[0],
      endDate:
        duration === "custom"
          ? endDate
          : calculateProjectEndDate(duration, startDate),
    },
    estimation: estimation ? Number(estimation) : null,
  };
  storedProjects.unshift(newProject);
  storedProjects.forEach((project, index) => (project.rowIndex = index + 1));
  projectSearchTerm = "";
  activeStatusFilter = "All";
  activeSortKey = "";
  activeSortKey = "";
  currentPage = 1;
  updateProjectTotal();
  showSuccessNotification("Project added successfully.");
};

const editProject = (
  project,
  name,
  manager,
  resources,
  duration,
  startDate,
  endDate,
  estimation
) => {
  lastProjectState = JSON.parse(JSON.stringify(project));
  project.name = name;
  project.manager = manager;
  project.lastUpdated = new Date().toUTCString();
  project.resources = resources;
  project.timeline.duration = duration;
  project.timeline.startDate =
    duration === "custom" ? startDate : new Date().toISOString().split("T")[0];
  project.timeline.endDate =
    duration === "custom"
      ? endDate
      : calculateProjectEndDate(duration, startDate);
  project.estimation = estimation ? Number(estimation) : null;
  showProjectEditNotification(project);
};

const calculateProjectEndDate = (duration, startDate = new Date()) => {
  const newDate = new Date(startDate);
  switch (duration) {
    case "15 days":
      newDate.setDate(newDate.getDate() + 15);
      break;
    case "1 month":
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case "1-2 months":
      newDate.setMonth(newDate.getMonth() + 2);
      break;
    case "3 months":
      newDate.setMonth(newDate.getMonth() + 3);
      break;
    case "4-6 months":
      newDate.setMonth(newDate.getMonth() + 6);
      break;
    case "1 year":
      newDate.setFullYear(newDate.getFullYear() + 1);
      break;
  }
  return newDate.toISOString().split("T")[0];
};

const showProjectEditNotification = (project) => {
  createToastNotification(`Project edited successfully.`, true, () =>
    undoProjectEdit(project)
  );
};

const undoProjectEdit = (project) => {
  project.name = lastProjectState.name;
  project.manager = lastProjectState.manager;
  project.lastUpdated = lastProjectState.lastUpdated;
  project.resources = lastProjectState.resources;
  project.estimation = lastProjectState.estimation;
  saveProjectsToLocalStorage();
  refreshAndDisplayProjects();
};

//* Rendering:
const refreshAndDisplayProjects = () => {
  updateStatusFilteredProjects();
  updateSearchFilteredProjects();
  updateSortedProjects();
  const totalItems = sortedProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  currentPage = Math.min(currentPage, totalPages);
  updatePaginatedProjects();
  renderProjectsTable(paginatedProjects);
  updatePaginationControlsAndInfo(currentPage, rowsPerPage, totalItems);
};

//* ======================= Initialization =======================
updateProjectTotal();
renderStatusFilterTabs();
initializeSortButtonHandlers();
deselectAllProjectsAndRefreshUI();
refreshAndDisplayProjects();

//* ======================= Event Listeners =======================
projectSearchInputElement.addEventListener("input", () => {
  projectSearchTerm = projectSearchInputElement.value;
  renderStatusFilterTabs();
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
});

createNewProjectButtonElement.addEventListener("click", () => {
  openProjectCreationModal();
});

selectAllProjectsElement.addEventListener("change", () => {
  syncProjectSelectionWithSelectAllProjectsElement();
  updateSelectAllProjectsElementState();
});

bulkActionsButtonElement.addEventListener("click", () => {
  bulkActionsContainerElement.appendChild(
    createBulkActionsDropdown(bulkActionsContainerElement)
  );
});

paginationRowsSelectElement.addEventListener("change", (e) => {
  rowsPerPage = Number(e.target.value);
  localStorage.setItem("paginationRowsPerPage", JSON.stringify(rowsPerPage));
  refreshAndDisplayProjects();
  updateSelectAllProjectsElementState();
});

paginationPrevButtonElement.addEventListener("click", () => {
  if (currentPage > 1) goToPage(currentPage - 1);
});

paginationNextButtonElement.addEventListener("click", () => {
  const totalPages = Math.ceil(storedProjects.length / rowsPerPage);
  if (currentPage < totalPages) goToPage(currentPage + 1);
});
