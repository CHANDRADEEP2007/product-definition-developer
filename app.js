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
              description: "Collect the full legal name of the applicant.",
              required: true,
            },
            {
              id: "field-2",
              label: "Date of Birth",
              key: "dateOfBirth",
              type: "Date",
              description: "Used to verify age and eligibility.",
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
  view: "overview",
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
  productSearch: document.getElementById("productSearch"),
  productOverview: document.getElementById("productOverview"),
  editorWorkspace: document.getElementById("editorWorkspace"),
  backToListButton: document.getElementById("backToListButton"),
  editorActions: document.getElementById("editorActions"),
  featureList: document.getElementById("featureList"),
};

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(defaultState);
  }
  try {
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      view: parsed.view ?? "overview",
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setView(view) {
  state.view = view;
  renderView();
}

function renderView() {
  const isOverview = state.view === "overview";
  elements.productOverview.classList.toggle("hidden", !isOverview);
  elements.editorWorkspace.classList.toggle("hidden", isOverview);
  elements.backToListButton.classList.toggle("hidden", isOverview);
  elements.editorActions.classList.toggle("hidden", isOverview);
}

function updateSelection({ productId, sectionId, fieldId }) {
  state.selectedProductId = productId ?? state.selectedProductId;
  state.selectedSectionId = sectionId ?? state.selectedSectionId;
  state.selectedFieldId = fieldId ?? state.selectedFieldId;
  render();
}

function getSelectedProduct() {
  return state.products.find((product) => product.id === state.selectedProductId);
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
  const filteredProducts = state.products.filter((product) =>
    product.name.toLowerCase().includes(search),
  );

  if (!filteredProducts.length) {
    elements.productList.innerHTML = `<li class="empty-state">No products match your search.</li>`;
    return;
  }

  filteredProducts.forEach((product) => {
    const li = document.createElement("li");
    li.className = "product-card";
    if (product.id === state.selectedProductId) {
      li.classList.add("is-active");
    }
    li.innerHTML = `
      <div class="product-card__header">
        <strong>${product.name}</strong>
        <button class="secondary-button" type="button" data-edit-product="${product.id}">
          Edit
        </button>
      </div>
      <div class="product-card__details">
        <span class="product-status">${product.status}</span>
        <span class="product-meta">${product.category}</span>
      </div>
    `;
    li.addEventListener("click", (event) => {
      if (event.target instanceof HTMLButtonElement) {
        return;
      }
      updateSelection({
        productId: product.id,
        sectionId: product.sections[0]?.id ?? null,
        fieldId: product.sections[0]?.fields[0]?.id ?? null,
      });
    });
    li.querySelector("[data-edit-product]").addEventListener("click", () => {
      const firstSection = product.sections[0];
      updateSelection({
        productId: product.id,
        sectionId: firstSection?.id ?? null,
        fieldId: firstSection?.fields[0]?.id ?? null,
      });
      setView("editor");
    });
    elements.productList.appendChild(li);
  });
}

function renderCanvas(product) {
  elements.canvasBody.innerHTML = "";
  if (!product) {
    elements.canvasBody.innerHTML = `<div class="empty-state">Create a product to begin.</div>`;
    return;
  }

  const sectionList = document.createElement("div");
  sectionList.className = "section-list";

  const selectedField = getSelectedField(getSelectedSection(product));
  sectionList.innerHTML = renderPlayground(product, selectedField);

  if (!product.sections.length) {
    sectionList.innerHTML += `<div class="empty-state">Add a section to begin.</div>`;
    elements.canvasBody.appendChild(sectionList);
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
        <button class="ghost-button" type="button" data-section="${section.id}">
          Add Field
        </button>
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
        if (field.id === state.selectedFieldId) {
          fieldRow.classList.add("is-selected");
        }
        fieldRow.innerHTML = `
          <div>
            <strong>${field.label}</strong>
            <div class="field-meta">${field.type} • ${field.key}</div>
          </div>
          <span class="field-meta">${field.required ? "Required" : "Optional"}</span>
        `;
        fieldRow.addEventListener("click", () => {
          updateSelection({
            sectionId: section.id,
            fieldId: field.id,
          });
        });
        list.appendChild(fieldRow);
      });
    }

    sectionEl
      .querySelector("button[data-section]")
      .addEventListener("click", () => addField(section.id, "Text"));

    sectionList.appendChild(sectionEl);
  });

  elements.canvasBody.appendChild(sectionList);

  const playgroundInputs = elements.canvasBody.querySelectorAll("[data-playground]");
  playgroundInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      if (!selectedField) {
        return;
      }
      const target = event.target;
      const fieldName = target.dataset.playground;
      if (!fieldName) {
        return;
      }
      if (fieldName === "required") {
        selectedField.required = target.checked;
      } else {
        selectedField[fieldName] = target.value;
      }
      render();
    });
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
      <label>Description <textarea data-field="description">${field.description || ""}</textarea></label>
      <label>
        Required
        <input type="checkbox" ${field.required ? "checked" : ""} data-field="required" />
      </label>
    `;
    fieldCard.querySelectorAll("input, textarea").forEach((input) => {
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
  const product = getSelectedProduct();
  const section = getSelectedSection(product);
  const field = getSelectedField(section);

  renderTopBar(product);
  renderProductList();
  renderCanvas(product);
  renderPropertyPanel(product, section, field);
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
  updateSelection({
    productId: newProduct.id,
    sectionId: newProduct.sections[0].id,
    fieldId: null,
  });
  closeModal();
  saveState();
  setView("editor");
}

function addSection() {
  const product = getSelectedProduct();
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
  const product = getSelectedProduct();
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
    description: "",
    required: false,
  };
  section.fields.push(newField);
  updateSelection({
    sectionId: section.id,
    fieldId: newField.id,
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
  const product = getSelectedProduct();
  if (product) {
    product.name = elements.productName.textContent.trim() || "Untitled Product";
    renderProductList();
    saveState();
  }
});
elements.featureList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }
  const type = target.dataset.type;
  if (!type) {
    return;
  }
  const product = getSelectedProduct();
  const section = getSelectedSection(product) ?? product?.sections[0];
  if (!section) {
    return;
  }
  addField(section.id, type);
});
elements.backToListButton.addEventListener("click", () => setView("overview"));

render();
renderView();
