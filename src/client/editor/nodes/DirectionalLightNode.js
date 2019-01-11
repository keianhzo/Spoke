import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import PhysicalDirectionalLight from "../objects/PhysicalDirectionalLight";
import SpokeDirectionalLightHelper from "../helpers/SpokeDirectionalLightHelper";
import serializeColor from "../utils/serializeColor";

export default class DirectionalLightNode extends EditorNodeMixin(PhysicalDirectionalLight) {
  static legacyComponentName = "directional-light";

  static nodeName = "Directional Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity, castShadow, shadowMapResolution, shadowBias, shadowRadius } = json.components.find(
      c => c.name === "directional-light"
    ).props;

    node.color.set(color);
    node.intensity = intensity;
    node.castShadow = castShadow;
    node.shadowBias = shadowBias || 0;
    node.shadowRadius = shadowRadius === undefined ? 1 : shadowRadius;

    if (shadowMapResolution) {
      node.shadowMapResolution.fromArray(shadowMapResolution);
    }

    return node;
  }

  constructor(editor) {
    super(editor);

    this.helper = new SpokeDirectionalLightHelper(this);
    this.helper.visible = false;
    this.add(this.helper);
  }

  onChange() {
    this.helper.update();
  }

  onSelect() {
    this.helper.visible = true;
  }

  onDeselect() {
    this.helper.visible = false;
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.helper.update();

    if (recursive) {
      for (const child of source.children) {
        if (child !== this.helper) {
          const clonedChild = child.clone();
          this.add(clonedChild);
        }
      }
    }

    return this;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "directional-light",
      props: {
        color: serializeColor(this.color),
        intensity: this.intensity,
        castShadow: this.castShadow,
        shadowMapResolution: this.shadowMapResolution.toArray()
      }
    });

    return json;
  }

  prepareForExport() {
    this.remove(this.helper);

    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "directional-light": {
          color: serializeColor(this.color),
          intensity: this.intensity,
          castShadow: this.castShadow,
          shadowMapResolution: this.shadowMapResolution.toArray()
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
