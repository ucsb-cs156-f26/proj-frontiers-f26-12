import Footer from "main/components/Nav/Footer";

export default {
  title: "components/Nav/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "720px" },
          type: "desktop",
        },
        narrow: {
          name: "Narrow",
          styles: { width: "375px", height: "812px" },
          type: "mobile",
        },
      },
    },
  },
};

const Template = () => <Footer />;

export const Desktop = Template.bind({});
Desktop.globals = { viewport: { value: "desktop", isRotated: false } };

export const Narrow = Template.bind({});
Narrow.globals = { viewport: { value: "narrow", isRotated: false } };
