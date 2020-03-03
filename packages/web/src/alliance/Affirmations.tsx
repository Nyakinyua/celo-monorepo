import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View, ViewStyle } from 'react-native'
import {
  clabs,
  clabsPreview,
  laboratoria,
  laboratoriaPreview,
  wfp,
  wfpPreview,
} from 'src/alliance/images/index'
import { H2, H3, H4 } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import cLabsLogo from 'src/logos/cLabs-logo.png'
import laboratoriaLogo from 'src/logos/laboratoria-dark.png'
import wfpLogo from 'src/logos/wfp-logo.png'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import Photo from 'src/shared/Photo'
import { fonts, standardStyles, textStyles } from 'src/styles'

export default function Affirmations() {
  const { t } = useTranslation(NameSpaces.alliance)
  return (
    <View>
      <GridRow
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
      >
        <Cell span={Spans.full}>
          <H3>{t('affirmations.smallTitle')}</H3>
          <H2>{t('affirmations.title')}</H2>
        </Cell>
      </GridRow>
      <Exemplar
        belief={<TransItalic i18nKey="affirmations.laboratoriaBelief" />}
        copy={t('affirmations.laboratoriaCopy')}
        image={laboratoria}
        preview={laboratoriaPreview}
        logo={
          <Image resizeMode="contain" source={laboratoriaLogo} style={{ width: 200, height: 70 }} />
        }
        contentStyle={styles.laborStyle}
      />
      <Exemplar
        belief={<TransItalic i18nKey="affirmations.wfpBelief" />}
        copy={t('affirmations.wfpCopy')}
        image={wfp}
        preview={wfpPreview}
        logo={<Image resizeMode="contain" source={wfpLogo} style={{ width: 182, height: 80 }} />}
        button={{ text: t('affirmations.wfpButton'), href: '/TODO' }}
        contentStyle={styles.cLabStyle}
      />
      <Exemplar
        belief={<TransItalic i18nKey="affirmations.cLabsBelief" />}
        copy={t('affirmations.cLabsCopy')}
        image={clabs}
        preview={clabsPreview}
        button={{ text: t('affirmations.cLabsButton'), href: '/TODO' }}
        logo={<Image resizeMode="contain" source={cLabsLogo} style={{ width: 140, height: 50 }} />}
        contentStyle={styles.wfpStyle}
      />
    </View>
  )
}

interface Props {
  image: ImageSourcePropType
  preview: ImageSourcePropType
  logo: React.ReactNode
  belief: React.ReactNode
  copy: string
  contentStyle?: ViewStyle
  button?: {
    text: string
    href: string
  }
}

function Exemplar({ image, logo, belief, copy, button, preview, contentStyle }: Props) {
  const { isMobile } = useScreenSize()
  return (
    <GridRow allStyle={standardStyles.elementalMargin}>
      <Cell span={Spans.half}>
        <View style={contentStyle}>
          {logo}
          <H4 style={standardStyles.elementalMargin}>{belief}</H4>
          <Text style={fonts.p}>{copy}</Text>
          {button && (
            <Button
              style={standardStyles.blockMarginTopMobile}
              kind={BTN.NAKED}
              size={SIZE.normal}
              text={button.text}
              href={button.href}
            />
          )}
        </View>
      </Cell>
      <Cell span={Spans.half}>
        <View style={!isMobile && styles.photoContainer}>
          <Photo image={image} ratio={471 / 550} preview={preview} />
        </View>
      </Cell>
    </GridRow>
  )
}

function TransItalic({ i18nKey }: { i18nKey: string }) {
  return (
    <Trans ns={NameSpaces.alliance} i18nKey={i18nKey}>
      <Text style={textStyles.italic}>""</Text>
    </Trans>
  )
}

const styles = StyleSheet.create({
  photoContainer: { paddingHorizontal: 20 },
  laborStyle: { maxWidth: 440 },
  cLabStyle: { maxWidth: 475 },
  wfpStyle: { maxWidth: 400 },
})