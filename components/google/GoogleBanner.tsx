// https://www.npmjs.com/package/react-adsense
import React from 'react';

interface GoogleProps {
    className: string;
    style: object;
    client: string;
    slot: string;
    layout: string;
    layoutKey?: string;
    format: string;
    responsive: string;
}

export default class GoogleBanner extends React.Component<GoogleProps> {
    componentDidMount() {
        if (window) (window['adsbygoogle'] = window['adsbygoogle'] || []).push({});
    };

    render() {
        return (
            <ins className={`${this.props.className} adsbygoogle`}
                style={this.props.style}
                data-ad-client={this.props.client}
                data-ad-slot={this.props.slot}
                data-ad-layout={this.props.layout}
                data-ad-layout-key={this.props.layoutKey}
                data-ad-format={this.props.format}
                data-full-width-responsive={this.props.responsive}></ins>
        );
    }

    static defaultProps = {
        className: '',
        style: { display: 'block' },
        format: 'auto',
        layout: '',
        layoutKey: '',
        responsive: 'false'
    };
};

