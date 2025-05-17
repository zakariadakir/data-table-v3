






.tooltip {
  @apply bg-gray-900 absolute w-max py-3 px-4 rounded-lg z-10 left-1/2 -translate-x-1/2 top-full text-center;
  @apply before:content-[''] before:absolute before:border-[10px] before:left-1/2 before:-translate-x-1/2 before:border-x-[10px] before:border-b-[10px] before:border-t-0 before:border-transparent before:border-b-gray-900;
}
.manager-tooltip {
  @apply tooltip before:top-[-7px];
}
.resource-tooltip {
  @apply tooltip before:top-[-9px];
}

.status-cell .status-on-track {
  @apply text-green-500 bg-green-0;
}
.status-cell .status-on-track-indicator {
  @apply bg-green-500;
}
.status-cell .status-potential-risk {
  @apply text-orange-500 bg-orange-0;
}
.status-cell .status-potential-risk-indicator {
  @apply bg-orange-500;
}
.status-cell .status-on-hold {
  @apply text-gray-500 bg-gray-50;
}
.status-cell .status-on-hold-indicator {
  @apply bg-gray-500;
}
.status-cell .status-at-risk {
  @apply text-red-500 bg-red-0;
}
.status-cell .status-at-risk-indicator {
  @apply bg-red-500;
}
.status-update-form {
  @apply absolute z-10 w-full max-w-[272px] rounded-lg bg-gray-0 shadow-statusUpdateForm top-full;
  @apply before:content-[''] before:absolute before:border-[10px] before:left-1/2 before:-translate-x-1/2 before:border-x-[10px] before:border-b-[10px] before:border-t-0 before:border-transparent before:top-[-10px] before:border-b-gray-0;
}
.project-row:has(.status-update-form) {
  @apply bg-gray-0;
}
.project-row:has(.status-update-form) .status-button-icon {
  @apply block;
}


.resource-checkbox {
  @apply cursor-pointer transition duration-300 py-0.5 px-2 tracking-[0.36px] text-xs font-medium rounded text-gray-700 bg-white shadow-resourceCheckboxDefault;
  @apply hover:text-gray-900 hover:shadow-resourceCheckboxDefaultHover;
  @apply active:shadow-resourceCheckboxDefaultActive;
}



module.exports = {
  theme: {
    extend: {
      boxShadow: {


        statusUpdateForm:
          "0 4px 20px rgba(0, 0, 0, 0.1)",

        toastMessage:
          "0px 5px 15px 0px rgba(0, 0, 0, 0.25),0px 15px 35px -5px rgba(17, 24, 38, 0.5),0px 0px 0px 0.5px rgba(255, 255, 255, 0.4)",

        deletionForm:
          "0px 10px 30px 0px #00000033, 0px 30px 70px -10px #11182640, 0px 0px 0px 1px #98A1B21A",

        managerRadioInputChecked:
          "0px 2px 6px 0px rgba(0, 0, 0, 0.25),0px 0px 0px 0.5px rgba(0, 0, 0, 0.08)",

        resourceCheckboxDefault:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.1), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxDefaultHover:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.16), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxDefaultActive:
          "0px 0px 0px 1px rgba(70, 79, 96, 0.32), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxChecked:
          "0px 0px 0px 1px rgb(94, 90, 219), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxCheckedHover:
          "0px 0px 0px 1px rgb(73, 69, 196), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
        resourceCheckboxCheckedActive:
          "0px 0px 0px 4px rgba(94, 90, 219, 0.4), 0px 0px 0px 1px rgb(94, 90, 219), 0px 1px 1px 0px rgba(0, 0, 0, 0.1)",
      },
    },
  },
};









export const displayProjectStatusUpdateNotification = (project) => {
  createToastNotification(
    `Status updated to "${project.status}".`,
    true,
    () => undoProjectStatusChange(project)
  );
};

export const displayProjectEditNotification = (project) => {
  createToastNotification(`Project edited successfully.`, true, () =>
    undoProjectEdit(project)
  );
};

export const displayProjectArchiveNotification = (project) => {
  createToastNotification(
    project.isArchived ? 'Project "Archived".' : 'Project "Unarchived".',
    true,
    () => undoProjectArchiving(project)
  );
};




























const generateLastUpdatedCell = (project) => {
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

const generateResourcesCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "py-3 px-2.5 text-center relative";
  const resourceCount = document.createElement("span");
  resourceCount.className =
    "text-sm text-gray-700 text-center rounded-md bg-indigo-0 px-[7px] py-1";
  resourceCount.textContent = project.resources.length;
  const tooltip = generateResourcesTooltip(project);
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

const generateResourcesTooltip = (project) => {
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

const generateTimelineCell = (project) => {
  const cell = document.createElement("td");
  cell.className =
    "px-2.5 py-3 text-sm text-gray-900 flex items-center justify-center gap-2";
  const badgeClass =
    "text-sm text-gray-700 rounded-md bg-indigo-0 px-2.5 py-1 whitespace-nowrap";
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

const generateEstimationCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "px-2.5 py-3 text-center text-sm text-gray-900";
  cell.textContent = formatEstimationForDisplay(project.estimation);
  return cell;
};

const generateActionsCell = (project) => {
  const cell = document.createElement("td");
  cell.className = "py-3 px-2.5";
  const dropdownContainer = document.createElement("div");
  dropdownContainer.className = "w-fit mx-auto relative";
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className =
    "ph-bold ph-dots-three-vertical text-gray-400 p-1 rounded transition-all duration-300 ease-in-out hover:bg-indigo-0 hover:text-gray-700";
  const actionsDropdown = generateActionsDropdown(project, dropdownContainer);
  dropdownContainer.appendChild(toggleBtn);
  cell.appendChild(dropdownContainer);
  toggleBtn.addEventListener("click", () => {
    dropdownContainer.appendChild(actionsDropdown);
  });
  return cell;
};

const generateActionsDropdown = (project, container) => {
  const dropdownMenu = document.createElement("ul");
  dropdownMenu.className =
    "actionsDropdown absolute top-0 right-0 bg-white py-2 px-1.5 rounded-md z-10 shadow-dropdownActions";
  dropdownMenu.innerHTML = `
  <li>
    <button type="button" id="editBtn" class="px-2.5 py-1 w-full hover:bg-indigo-0 rounded-md text-left font-medium text-sm text-gray-700">Edit</button>
  </li>
  <li>
    <button type="button" id="archiveBtn" class="px-2.5 py-1 w-full hover:bg-indigo-0 rounded-md text-left font-medium text-sm text-orange-500">
      ${project.isArchived ? "Unarchive" : "Archive"}
    </button>
  </li>
  <li>
    <button type="button" id="deleteBtn" class="px-2.5 py-1 w-full hover:bg-indigo-0 rounded-md text-left font-medium text-sm text-red-500">Delete</button>
  </li>
  `;
  const editBtn = dropdownMenu.querySelector("#editBtn");
  const archiveBtn = dropdownMenu.querySelector("#archiveBtn");
  const deleteBtn = dropdownMenu.querySelector("#deleteBtn");
  editBtn.addEventListener("click", () => {
    openProjectEditingModal(project);
    dropdownMenu.remove();
  });
  archiveBtn.addEventListener("click", () => {
    toggleProjectArchivalStatus(project);
    dropdownMenu.remove();
  });
  deleteBtn.addEventListener("click", () => {
    openProjectDeletionModal(project);
    dropdownMenu.remove();
  });
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdownMenu.remove();
    }
  });
  return dropdownMenu;
};


