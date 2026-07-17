import { modelCreateCall, Model } from "../networking";
import NotificationManager from "../molecules/notifications_manager";
import i18n from "@/i18n/i18n";

export const handleAddAutoRouterSubmit = async (values: any, accessToken: string, form: any, callback?: () => void) => {
  try {
    let autoRouterConfig: any;

    if (values.model_type === "complexity_router") {
      // Complexity Router configuration

      autoRouterConfig = {
        model_name: values.auto_router_name,
        litellm_params: {
          // Use special prefix for complexity router
          model: `auto_router/complexity_router`,
          // Pass the complexity router config as a JSON object (not stringified)
          complexity_router_config: values.complexity_router_config,
          // Default model for fallback (use MEDIUM or first available tier)
          complexity_router_default_model: values.auto_router_default_model,
        },
        model_info: {},
      };
    } else {
      // Semantic Router configuration (existing behavior)

      autoRouterConfig = {
        model_name: values.auto_router_name,
        litellm_params: {
          model: `auto_router/${values.auto_router_name}`,
          auto_router_config: JSON.stringify(values.auto_router_config), // Convert JSON object to string as expected by backend
          auto_router_default_model: values.auto_router_default_model,
        },
        model_info: {},
      };

      // Add optional embedding model if provided
      if (values.auto_router_embedding_model && values.auto_router_embedding_model !== "custom") {
        autoRouterConfig.litellm_params.auto_router_embedding_model = values.auto_router_embedding_model;
      } else if (values.custom_embedding_model) {
        autoRouterConfig.litellm_params.auto_router_embedding_model = values.custom_embedding_model;
      }
    }

    // Add team information if provided
    if (values.team_id) {
      autoRouterConfig.model_info.team_id = values.team_id;
    }

    // Add model access groups if provided
    if (values.model_access_group && values.model_access_group.length > 0) {
      autoRouterConfig.model_info.access_groups = values.model_access_group;
    }

    // Create the auto router using the same model creation endpoint
    await modelCreateCall(accessToken, autoRouterConfig as Model);

    // Show success notification
    const routerTypeName = i18n.t(
      values.model_type === "complexity_router"
        ? "modelsAndEndpoints.addModel.autoRouter.complexity.name"
        : "modelsAndEndpoints.addModel.autoRouter.semantic.name",
    );
    NotificationManager.success(
      i18n.t("modelsAndEndpoints.addModel.autoRouter.notifications.created", {
        type: routerTypeName,
        name: values.auto_router_name,
      }),
    );

    // Reset the form
    form.resetFields();

    // Call the callback if provided (e.g., to close modal)
    if (callback) {
      callback();
    }
  } catch (error) {
    console.error("Failed to add auto router:", error);
    NotificationManager.fromBackend(
      i18n.t("modelsAndEndpoints.addModel.autoRouter.notifications.failed", { error: String(error) }),
    );
  }
};
