const STORAGE_KEY = "pdt.v1";

const defaultState = {
  products: [
    {
      id: "prod-1",
      name: "Starter Checking",
      description: "Core checking account product definition.",
      category: "Retail Banking",
      status: "Draft",
      sections: [
        {
          id: "section-1",
          title: "Basic Details",
          description: "Foundational customer details.",
          fields: [
            {
              id: "field-1",
              label: "Applicant Name",
              key: "applicantName",
              type: "Text",
              required: true,
            },
            {
              id: "field-2",
              label: "Date of Birth",
              key: "dateOfBirth",
              type: "Date",
              required: true,
            },
          ],
        },
      ],
    },
  ],
  selectedProductId: "prod-1",
  selectedSectionId: "section-1",
  selectedFieldId: "field-1",
  editingProductId: null,
};

const elements = {
  productName: document.getElementById("productName"),
  productList: document.getElementById("productList"),
  canvasBody: document.getElementById("canvasBody"),
  propertyPanel: document.getElementById("propertyPanel"),
  addSectionButton: document.getElementById("addSectionButton"),
  newProductButton: document.getElementById("newProductButton"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  cancelModalButton: document.getElementById("cancelModalButton"),
  createProductButton: document.getElementById("createProductButton"),
  newProductName: document.getElementById("newProductName"),
  newProductDescription: document.getElementById("newProductDescription"),
  newProductCategory: document.getElementById("newProductCategory"),
  saveButton: document.getElementById("saveButton"),
  saveVersionButton: document.getElementById("saveVersionButton"),
  toolbox: document.getElementById("toolbox"),
  productSearch: document.getElementById("productSearch"),
};

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(defaultState);
  }
  try {
    return JSON.parse(stored);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateSelection({ productId, sectionId, fieldId }) {
  state.selectedProductId = productId ?? state.selectedProductId;
  state.selectedSectionId = sectionId ?? state.selectedSectionId;
  state.selectedFieldId = fieldId ?? state.selectedFieldId;
  render();
}

function updateEditingProduct(productId) {
  state.editingProductId = productId;
  const product = state.products.find((item) => item.id === productId);
  updateSelection({
    productId,
    sectionId: product?.sections[0]?.id ?? null,
    fieldId: product?.sections[0]?.fields[0]?.id ?? null,
  });
}

function getSelectedProduct() {
  return state.products.find((product) => product.id === state.selectedProductId);
}

function getEditingProduct() {
  return state.products.find((product) => product.id === state.editingProductId);
}

function getSelectedSection(product) {
  return product?.sections.find((section) => section.id === state.selectedSectionId);
}

function getSelectedField(section) {
  return section?.fields.find((field) => field.id === state.selectedFieldId);
}

function renderProductList() {
  const search = elements.productSearch.value.toLowerCase();
  elements.productList.innerHTML = "";
  state.products
    .filter((product) => product.name.toLowerCase().includes(search))
    .forEach((product) => {
      const li = document.createElement("li");
      li.className = "product-card";
      if (product.id === state.editingProductId) {
        li.classList.add("is-active");
      }
      li.innerHTML = `
        <strong>${product.name}</strong>
        <span class="product-status">${product.status}</span>
        <span class="product-meta">${product.category}</span>
        <div class="product-card__footer">
          <button class="text-button" type="button" data-action="edit">Edit</button>
          <button class="danger-button" type="button" data-action="delete">Delete</button>
        </div>
      `;
      li.querySelector('[data-action="edit"]').addEventListener("click", (event) => {
        event.stopPropagation();
        updateEditingProduct(product.id);
      });
      li.querySelector('[data-action="delete"]').addEventListener("click", (event) => {
        event.stopPropagation();
        deleteProduct(product.id);
      });
      elements.productList.appendChild(li);
    });
}

function renderEmptyCanvas() {
  elements.canvasBody.innerHTML = `
    <div class="empty-state">
      Select a product from the left rail and click Edit to start building fields.
    </div>
  `;
}

function renderCanvas(product) {
  elements.canvasBody.innerHTML = "";
  if (!product) {
    renderEmptyCanvas();
    return;
  }

  if (!product.sections.length) {
    elements.canvasBody.innerHTML = `<div class="empty-state">Add a section to begin.</div>`;
    return;
  }

  product.sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "section-card";
    sectionEl.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">${section.title}</div>
          <div class="field-meta">${section.description || "Section description"}</div>
        </div>
        <div class="section-actions">
          <button class="ghost-button" type="button" data-section="${section.id}">
            Add Field
          </button>
          <button class="danger-button" type="button" data-delete="${section.id}">
            Delete Section
          </button>
        </div>
      </div>
      <div class="field-list"></div>
    `;

    const list = sectionEl.querySelector(".field-list");
    if (!section.fields.length) {
      list.innerHTML = `<div class="empty-state">Drag a field from the toolbox to begin.</div>`;
    } else {
      section.fields.forEach((field) => {
        const fieldRow = document.createElement("div");
        fieldRow.className = "field-row";
        fieldRow.setAttribute("draggable", "true");
        fieldRow.dataset.fieldId = field.id;
        fieldRow.dataset.sectionId = section.id;
        if (field.id === state.selectedFieldId) {
          fieldRow.classList.add("is-selected");
        }
        fieldRow.innerHTML = `
          <div>
            <strong>${field.label}</strong>
            <div class="field-meta">${field.type} • ${field.key}</div>
          </div>
          <div class="field-row__controls">
            <span class="field-meta">${field.required ? "Required" : "Optional"}</span>
            <span class="drag-handle" aria-hidden="true">⠿</span>
          </div>
        `;
        fieldRow.addEventListener("click", () => {
          updateSelection({
            sectionId: section.id,
            fieldId: field.id,
          });
        });
        fieldRow.addEventListener("dragstart", (event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", JSON.stringify({
            fieldId: field.id,
            sectionId: section.id,
          }));
        });
        fieldRow.addEventListener("dragover", (event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        });
        fieldRow.addEventListener("drop", (event) => {
          event.preventDefault();
          const payload = parseDragPayload(event.dataTransfer.getData("text/plain"));
          if (!payload) {
            return;
          }
          reorderField(payload, { sectionId: section.id, beforeFieldId: field.id });
        });
        list.appendChild(fieldRow);
      });
    }

    sectionEl
      .querySelector("button[data-section]")
      .addEventListener("click", () => addField(section.id, "Text"));
    sectionEl
      .querySelector("button[data-delete]")
      .addEventListener("click", () => deleteSection(section.id));

    sectionEl.addEventListener("dragover", (event) => {
      if (!isDraggingFieldType(event)) {
        return;
      }
      event.preventDefault();
      sectionEl.classList.add("is-dragover");
    });
    sectionEl.addEventListener("dragleave", () => {
      sectionEl.classList.remove("is-dragover");
    });
    sectionEl.addEventListener("drop", (event) => {
      event.preventDefault();
      sectionEl.classList.remove("is-dragover");
      const payload = parseDragPayload(event.dataTransfer.getData("text/plain"));
      if (payload?.type) {
        addField(section.id, payload.type);
        return;
      }
      if (payload?.fieldId) {
        reorderField(payload, { sectionId: section.id });
      }
    });

    elements.canvasBody.appendChild(sectionEl);
  });
}

function renderPropertyPanel(product, section, field) {
  if (!product) {
    elements.propertyPanel.innerHTML = `<div class="empty-state">Select a product to view properties.</div>`;
    return;
  }

  elements.propertyPanel.innerHTML = "";

  if (field) {
    const fieldCard = document.createElement("div");
    fieldCard.className = "property-card";
    fieldCard.innerHTML = `
      <h4>Field Basics</h4>
      <label>Label <input type="text" value="${field.label}" data-field="label" /></label>
      <label>Key <input type="text" value="${field.key}" data-field="key" /></label>
      <label>Type <input type="text" value="${field.type}" disabled /></label>
      <label>
        Required
        <input type="checkbox" ${field.required ? "checked" : ""} data-field="required" />
      </label>
    `;
    fieldCard.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target;
        const fieldName = target.dataset.field;
        if (!fieldName) {
          return;
        }
        if (fieldName === "required") {
          field.required = target.checked;
        } else {
          field[fieldName] = target.value;
        }
        render();
      });
    });
    elements.propertyPanel.appendChild(fieldCard);
  }

  if (section) {
    const sectionCard = document.createElement("div");
    sectionCard.className = "property-card";
    sectionCard.innerHTML = `
      <h4>Section</h4>
      <label>Title <input type="text" value="${section.title}" data-section="title" /></label>
      <label>Description <textarea data-section="description">${section.description || ""}</textarea></label>
    `;
    sectionCard.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target;
        const fieldName = target.dataset.section;
        if (!fieldName) {
          return;
        }
        section[fieldName] = target.value;
        render();
      });
    });
    elements.propertyPanel.appendChild(sectionCard);
  }

  const productCard = document.createElement("div");
  productCard.className = "property-card";
  productCard.innerHTML = `
    <h4>Product</h4>
    <label>Name <input type="text" value="${product.name}" data-product="name" /></label>
    <label>Description <textarea data-product="description">${product.description}</textarea></label>
    <label>Category <input type="text" value="${product.category}" data-product="category" /></label>
  `;
  productCard.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.target;
      const fieldName = target.dataset.product;
      if (!fieldName) {
        return;
      }
      product[fieldName] = target.value;
      if (fieldName === "name") {
        elements.productName.textContent = product.name;
      }
      renderProductList();
    });
  });
  elements.propertyPanel.appendChild(productCard);
}

function renderTopBar(product) {
  elements.productName.textContent = product?.name ?? "Untitled Product";
}

function render() {
  const product = getEditingProduct();
  const section = getSelectedSection(product);
  const field = getSelectedField(section);

  renderTopBar(product);
  renderProductList();
  renderCanvas(product);
  renderPropertyPanel(product, section, field);
  elements.addSectionButton.disabled = !product;
}

function openModal() {
  elements.modalBackdrop.classList.remove("hidden");
  elements.newProductName.value = "";
  elements.newProductDescription.value = "";
  elements.newProductCategory.value = "";
}

function closeModal() {
  elements.modalBackdrop.classList.add("hidden");
}

function addProduct() {
  const name = elements.newProductName.value.trim() || "Untitled Product";
  const newProduct = {
    id: `prod-${crypto.randomUUID()}`,
    name,
    description: elements.newProductDescription.value.trim(),
    category: elements.newProductCategory.value.trim() || "Uncategorized",
    status: "Draft",
    sections: [
      {
        id: `section-${crypto.randomUUID()}`,
        title: "Basic Details",
        description: "Drag a field from the toolbox to begin.",
        fields: [],
      },
    ],
  };
  state.products.unshift(newProduct);
  updateEditingProduct(newProduct.id);
  closeModal();
  saveState();
}

function addSection() {
  const product = getEditingProduct();
  if (!product) {
    return;
  }
  const newSection = {
    id: `section-${crypto.randomUUID()}`,
    title: `New Section ${product.sections.length + 1}`,
    description: "",
    fields: [],
  };
  product.sections.push(newSection);
  updateSelection({
    sectionId: newSection.id,
    fieldId: null,
  });
  saveState();
}

function addField(sectionId, type) {
  const product = getEditingProduct();
  const section = product?.sections.find((item) => item.id === sectionId);
  if (!section) {
    return;
  }
  const slug = `${type.toLowerCase()}${section.fields.length + 1}`;
  const newField = {
    id: `field-${crypto.randomUUID()}`,
    label: `${type} Field`,
    key: slug,
    type,
    required: false,
  };
  section.fields.push(newField);
  updateSelection({
    sectionId: section.id,
    fieldId: newField.id,
  });
  saveState();
}

function deleteSection(sectionId) {
  const product = getEditingProduct();
  if (!product) {
    return;
  }
  product.sections = product.sections.filter((section) => section.id !== sectionId);
  updateSelection({
    sectionId: product.sections[0]?.id ?? null,
    fieldId: product.sections[0]?.fields[0]?.id ?? null,
  });
  saveState();
}

function deleteProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }
  const confirmDelete = window.confirm(`Delete ${product.name}? This cannot be undone.`);
  if (!confirmDelete) {
    return;
  }
  state.products = state.products.filter((item) => item.id !== productId);
  if (state.editingProductId === productId) {
    state.editingProductId = null;
  }
  render();
  saveState();
}

function parseDragPayload(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isDraggingFieldType(event) {
  return Array.from(event.dataTransfer.types).includes("text/plain");
}

function reorderField(payload, { sectionId, beforeFieldId }) {
  const product = getEditingProduct();
  if (!product || !payload?.fieldId) {
    return;
  }
  const sourceSection = product.sections.find((section) => section.id === payload.sectionId);
  const targetSection = product.sections.find((section) => section.id === sectionId);
  if (!sourceSection || !targetSection) {
    return;
  }
  const fieldIndex = sourceSection.fields.findIndex((field) => field.id === payload.fieldId);
  if (fieldIndex === -1) {
    return;
  }
  const [field] = sourceSection.fields.splice(fieldIndex, 1);
  if (!beforeFieldId) {
    targetSection.fields.push(field);
  } else {
    const beforeIndex = targetSection.fields.findIndex((item) => item.id === beforeFieldId);
    if (beforeIndex === -1) {
      targetSection.fields.push(field);
    } else {
      targetSection.fields.splice(beforeIndex, 0, field);
    }
  }
  updateSelection({
    sectionId: targetSection.id,
    fieldId: field.id,
  });
  saveState();
}

elements.addSectionButton.addEventListener("click", addSection);
elements.newProductButton.addEventListener("click", openModal);
elements.cancelModalButton.addEventListener("click", closeModal);
elements.createProductButton.addEventListener("click", addProduct);
elements.saveButton.addEventListener("click", saveState);
elements.saveVersionButton.addEventListener("click", () => {
  alert("Version snapshots will be available in a future release.");
});
elements.productSearch.addEventListener("input", renderProductList);
elements.productName.addEventListener("blur", () => {
  const product = getEditingProduct();
  if (product) {
    product.name = elements.productName.textContent.trim() || "Untitled Product";
    renderProductList();
    saveState();
  }
});
elements.toolbox.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }
  const type = target.dataset.type;
  if (!type || type === "Section") {
    return;
  }
  const product = getEditingProduct();
  const section = getSelectedSection(product);
  if (!section) {
    return;
  }
  addField(section.id, type);
});

document.querySelectorAll(".toolbox-item").forEach((item) => {
  item.setAttribute("draggable", "true");
  item.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", JSON.stringify({ type: item.dataset.type }));
  });
});

render();
