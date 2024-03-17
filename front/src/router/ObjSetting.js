import * as React from 'react';
import {Container, Slider, Tab, Tabs} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";

function Obj(){
    return(
        <>
            <Container maxWidth={"sm"}>
                <Box sx={{ bgcolor: '#cfe8fc', height: '80vh'}} className={"meituan"}>
                    <Slider
                        disabled={false}
                        marks={false}
                        max={100}
                        min={0}
                        size="medium"
                        valueLabelDisplay="on"

                        className={"slid"}
                    />
                </Box>
            </Container>
        </>
    )
}
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

export default function Setting() {
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box
            sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 224 }}
            className={"setContainer"}
        >
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                sx={{ borderRight: 1, borderColor: 'divider' }}
            >
                <Tab label="物体一" {...a11yProps(0)} />
                <Tab label="物体二" {...a11yProps(1)} />
                <Tab label="物体三" {...a11yProps(2)} />
            </Tabs>
            <TabPanel value={value} index={0}>
                Object One
            </TabPanel>
            <TabPanel value={value} index={1}>
                Object Two
            </TabPanel>
            <TabPanel value={value} index={2}>
                Object Three
            </TabPanel>
        </Box>
    );
}